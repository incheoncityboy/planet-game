// const Matter = require('matter-js');
document.addEventListener('DOMContentLoaded', function() {

    // 프리로딩 함수 추가
    function preloadImages(imageUrls, callback) {
        let loadedImages = 0;
        const totalImages = imageUrls.length;
        const images = [];

        imageUrls.forEach((url, index) => {
            const img = new Image();
            img.src = url;
            img.onload = () => {
                loadedImages += 1;
                if (loadedImages === totalImages && callback) {
                    callback(images);  // 모든 이미지가 로드되면 콜백 실행
                }
            };
            images[index] = img;
        });
    }

    // 로드할 이미지 URL 목록 추가
    const planetImages = [
        '/static/img-planet/circle0.png',
        '/static/img-planet/circle1.png',
        '/static/img-planet/circle2.png',
        '/static/img-planet/circle3.png',
        '/static/img-planet/circle4.png',
        '/static/img-planet/circle5.png',
        '/static/img-planet/circle6.png',
        '/static/img-planet/circle7.png',
        '/static/img-planet/circle8.png',
        '/static/img-planet/circle9.png',
        '/static/img-planet/circle10.png',
    ];

    // 프리로딩 후 게임 시작
    preloadImages(planetImages, () => {
        console.log('All images preloaded');
        Game.initGame();  // 이미지 로딩 완료 후 게임 시작
    });

    const endGameButton = document.getElementById('end-game-button');
    if (endGameButton) {
        console.log("X 버튼이 발견되었습니다.");
        endGameButton.addEventListener('click', function() {
            console.log("X 버튼이 클릭되었습니다.");
            Game.loseGame();
        });
    } else {
        console.log("X 버튼을 찾을 수 없습니다.");
    }

    // 모달 버튼 클릭 이벤트 처리
    document.getElementById('go-to-login').addEventListener('click', function() {
        window.location.href = '/login';  // 로그인 페이지로 리디렉션
    });

    document.getElementById('play-again').addEventListener('click', function() {
        window.location.reload();  // 현재 페이지 새로고침
    });

    function mulberry32(a) {
        return function() {
            let t = a += 0x6D2B79F5;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        }
    }

    const rand = mulberry32(Date.now());

    const {
        Engine, Render, Runner, Composites, Common, MouseConstraint, Mouse,
        Composite, Bodies, Events,
    } = Matter;

    const wallPad = 64;
    const loseHeight = 84;
    const statusBarHeight = 48;
    const previewBallHeight = 32;
    const friction = {
        friction: 0.006,
        frictionStatic: 0.006,
        frictionAir: 0,
        restitution: 0.1
    };

    const GameStates = {
        MENU: 0,
        READY: 1,
        DROP: 2,
        LOSE: 3,
    };

    const Game = {
        width: 640,
        height: 960,
        elements: {
            canvas: document.getElementById('game-canvas'),
            ui: document.getElementById('game-ui'),
            score: document.getElementById('game-score'),
            statusValue: document.getElementById('game-highscore-value'),
            nextFruitImg: document.getElementById('game-next-fruit'),
            previewBall: null,
        },
        cache: { highscore: 0 },
        sounds: {
            click: new Audio('/static/click.mp3'),
            pop0: new Audio('/static/pop0.mp3'),
            pop1: new Audio('/static/pop1.mp3'),
            pop2: new Audio('/static/pop2.mp3'),
            pop3: new Audio('/static/pop3.mp3'),
            pop4: new Audio('/static/pop4.mp3'),
            pop5: new Audio('/static/pop5.mp3'),
            pop6: new Audio('/static/pop6.mp3'),
            pop7: new Audio('/static/pop7.mp3'),
            pop8: new Audio('/static/pop8.mp3'),
            pop9: new Audio('/static/pop9.mp3'),
            pop10: new Audio('/static/pop10.mp3'),
        },

        stateIndex: GameStates.MENU,

        score: 0,
        fruitsMerged: [],
        calculateScore: function () {
            const score = Game.fruitsMerged.reduce((total, count, sizeIndex) => {
                const value = Game.fruitSizes[sizeIndex].scoreValue * count;
                return total + value;
            }, 0);

            Game.score = score;
            Game.elements.score.innerText = Game.score;
        },

        fruitSizes: [
            { radius: 24,  scoreValue: 1,  img: '/static/img-planet/circle0.png'  },
            { radius: 32,  scoreValue: 3,  img: '/static/img-planet/circle1.png'  },
            { radius: 40,  scoreValue: 6,  img: '/static/img-planet/circle2.png'  },
            { radius: 56,  scoreValue: 10, img: '/static/img-planet/circle3.png'  },
            { radius: 64,  scoreValue: 15, img: '/static/img-planet/circle4.png'  },
            { radius: 72,  scoreValue: 21, img: '/static/img-planet/circle5.png'  },
            { radius: 84,  scoreValue: 28, img: '/static/img-planet/circle6.png'  },
            { radius: 96,  scoreValue: 36, img: '/static/img-planet/circle7.png'  },
            { radius: 128, scoreValue: 45, img: '/static/img-planet/circle8.png'  },
            { radius: 160, scoreValue: 55, img: '/static/img-planet/circle9.png'  },
            { radius: 192, scoreValue: 66, img: '/static/img-planet/circle10.png' },
        ],	
        currentFruitSize: 0,
        nextFruitSize: 0,	
        setNextFruitSize: function () {
            Game.nextFruitSize = Math.floor(rand() * 5);
            Game.elements.nextFruitImg.src = `/static/img-planet/circle${Game.nextFruitSize}.png`;
        },

        showHighscore: function () {
            Game.elements.statusValue.innerText = Game.cache.highscore;
        },
        loadHighscore: function () {
            const gameCache = localStorage.getItem('suika-game-cache');
            if (gameCache === null) {
                Game.saveHighscore();
                return;
            }

            Game.cache = JSON.parse(gameCache);
            Game.showHighscore();
        },
        saveHighscore: function () {
            Game.calculateScore();
            if (Game.score < Game.cache.highscore) return;

            Game.cache.highscore = Game.score;
            Game.showHighscore();

            localStorage.setItem('suika-game-cache', JSON.stringify(Game.cache));
        },

        initGame: function () {
            Render.run(render);
            Runner.run(runner, engine);

            Composite.add(engine.world, menuStatics);

            Game.loadHighscore();
            Game.elements.ui.style.display = 'none';
            Game.fruitsMerged = Array.apply(null, Array(Game.fruitSizes.length)).map(() => 0);

            const menuMouseDown = function () {
                if (mouseConstraint.body === null || mouseConstraint.body?.label !== 'btn-start') {
                    return;
                }

                Events.off(mouseConstraint, 'mousedown', menuMouseDown);
                Game.startGame();
            }

            Events.on(mouseConstraint, 'mousedown', menuMouseDown);
        },

	startGame: function () {
		Game.sounds.click.play();

		Composite.remove(engine.world, menuStatics);
		Composite.add(engine.world, gameStatics);

		Game.calculateScore();
		// Game.elements.endTitle.innerText = 'Game Over!';제거후보
		Game.elements.ui.style.display = 'block';
		// Game.elements.end.style.display = 'none';제거후보
		Game.elements.previewBall = Game.generateFruitBody(Game.width / 2, previewBallHeight, 0, { isStatic: true });
		Composite.add(engine.world, Game.elements.previewBall);

		setTimeout(() => {
			Game.stateIndex = GameStates.READY;
		}, 250);

		Events.on(mouseConstraint, 'mouseup', function (e) {
			Game.addFruit(e.mouse.position.x);
		});

		Events.on(mouseConstraint, 'mousemove', function (e) {
			if (Game.stateIndex !== GameStates.READY) return;
			if (Game.elements.previewBall === null) return;

			Game.elements.previewBall.position.x = e.mouse.position.x;
		});

		Events.on(engine, 'collisionStart', function (e) {
			for (let i = 0; i < e.pairs.length; i++) {
				const { bodyA, bodyB } = e.pairs[i];

				// Skip if collision is wall
				if (bodyA.isStatic || bodyB.isStatic) continue;

				const aY = bodyA.position.y + bodyA.circleRadius;
				const bY = bodyB.position.y + bodyB.circleRadius;

				// Uh oh, too high!
				if (aY < loseHeight || bY < loseHeight) {
					Game.loseGame();
					return;
				}

				// Skip different sizes
				if (bodyA.sizeIndex !== bodyB.sizeIndex) continue;

				// Skip if already popped
				if (bodyA.popped || bodyB.popped) continue;

				let newSize = bodyA.sizeIndex + 1;

				// Go back to smallest size
				if (bodyA.circleRadius >= Game.fruitSizes[Game.fruitSizes.length - 1].radius) {
					newSize = 0;
				}

				Game.fruitsMerged[bodyA.sizeIndex] += 1;

				// Therefore, circles are same size, so merge them.
				const midPosX = (bodyA.position.x + bodyB.position.x) / 2;
				const midPosY = (bodyA.position.y + bodyB.position.y) / 2;

				bodyA.popped = true;
				bodyB.popped = true;

				Game.sounds[`pop${bodyA.sizeIndex}`].play();
				Composite.remove(engine.world, [bodyA, bodyB]);
				Composite.add(engine.world, Game.generateFruitBody(midPosX, midPosY, newSize));
				Game.addPop(midPosX, midPosY, bodyA.circleRadius);
				Game.calculateScore();
			}
		});
	},

	addPop: function (x, y, r) {
		const circle = Bodies.circle(x, y, r, {
			isStatic: true,
			collisionFilter: { mask: 0x0040 },
			angle: rand() * (Math.PI * 2),
			render: {
				sprite: {
					texture: '/static/img/pop.png',
					xScale: r / 384,
					yScale: r / 384,
				}
			},
		});

		Composite.add(engine.world, circle);
		setTimeout(() => {
			Composite.remove(engine.world, circle);
		}, 100);
	},

	loseGame: function () {
		Game.stateIndex = GameStates.LOSE;
		// Game.elements.end.style.display = 'flex'; 제거후보
		runner.enabled = false;
		Game.saveHighscore();
	
		// 점수를 localStorage에 저장
		localStorage.setItem('latestScore', Game.score);
	
		// 로그인 상태 확인
		fetch('/api/login', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		})
		.then(response => response.json())
		.then(data => {
			console.log('Login status check response:', data);  // 로그인 상태 확인 결과를 콘솔에 출력
			if (data.status === 'success') {
				console.log(`Logged in as: ${data.username}`); // 로그인된 유저네임을 콘솔에 출력
				// 로그인 되어 있으면 서버로 점수 전송
				Game.submitScoreAndRedirect(data.username);
			} else {
				console.log('User is not logged in.');
				// 로그인 안되어 있으면 모달 표시
				document.getElementById('login-modal').style.display = 'flex';
			}
		})
		.catch(error => {
			console.error('Error checking login status:', error);
			alert('Error checking login status, redirecting to login page.');
			window.location.href = '/login';  // 오류 발생 시 로그인 페이지로 리디렉션
		});
	},
	
	submitScoreAndRedirect: function (username) {
		const score = localStorage.getItem('latestScore');  // 저장된 점수 가져오기
	
		if (!score) {
			console.error('No score available.');
			window.location.href = '/login';  // 점수가 없으면 로그인 페이지로 리디렉션
			return;
		}
	
		console.log(`Submitting score for user: ${username}, score: ${score}`); // 전송할 유저네임과 점수를 콘솔에 출력
	
		fetch('/api/rank', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				username: username,   // 로그인 상태에서 받은 username 사용
				score: parseInt(score),   // 점수를 서버로 전송
			}),
		})
		.then(response => {
			if (response.ok) {
				console.log('Score submitted successfully.');  // 점수 전송 성공 로그
				// 점수 전송 성공 시 랭킹 페이지로 리디렉션
				window.location.href = '/rank.html';
			} else {
				alert('Failed to submit score.');
			}
		})
		.catch(error => {
			console.error('Error submitting score:', error);
		});
	},
	
	

	
	

	

	// Returns an index, or null
	lookupFruitIndex: function (radius) {
		const sizeIndex = Game.fruitSizes.findIndex(size => size.radius == radius);
		if (sizeIndex === undefined) return null;
		if (sizeIndex === Game.fruitSizes.length - 1) return null;

		return sizeIndex;
	},

	generateFruitBody: function (x, y, sizeIndex, extraConfig = {}) {
		const size = Game.fruitSizes[sizeIndex];
		const circle = Bodies.circle(x, y, size.radius, {
			...friction,
			...extraConfig,
			render: { sprite: { texture: size.img, xScale: size.radius / 512, yScale: size.radius / 512 } },
		});
		circle.sizeIndex = sizeIndex;
		circle.popped = false;

		return circle;
	},

	addFruit: function (x) {
		if (Game.stateIndex !== GameStates.READY) return;

		Game.sounds.click.play();

		Game.stateIndex = GameStates.DROP;
		const latestFruit = Game.generateFruitBody(x, previewBallHeight, Game.currentFruitSize);
		Composite.add(engine.world, latestFruit);

		Game.currentFruitSize = Game.nextFruitSize;
		Game.setNextFruitSize();
		Game.calculateScore();

		Composite.remove(engine.world, Game.elements.previewBall);
		Game.elements.previewBall = Game.generateFruitBody(render.mouse.position.x, previewBallHeight, Game.currentFruitSize, {
			isStatic: true,
			collisionFilter: { mask: 0x0040 }
		});

		setTimeout(() => {
			if (Game.stateIndex === GameStates.DROP) {
				Composite.add(engine.world, Game.elements.previewBall);
				Game.stateIndex = GameStates.READY;
			}
		}, 500);
	}
}

const engine = Engine.create();
const runner = Runner.create();
const render = Render.create({
	element: Game.elements.canvas,
	engine,
	options: {
		width: Game.width,
		height: Game.height,
		wireframes: false,
		background: '/static/img-planet/bg_space.png'
	}
});
// #C7AEDA 보라색 배경

const menuStatics = [
    Bodies.rectangle(Game.width / 2, Game.height * 0.4, 512, 512, {
        isStatic: true,
        render: { sprite: { texture: '/static/img/planet-src.png' } },
    }),

    // Start button
    Bodies.rectangle(Game.width / 2, Game.height * 0.75, 512, 96, {
        isStatic: true,
        label: 'btn-start',
        render: { sprite: { texture: '/static/img-planet/game-start-src.png' } },
    }),
];

const wallProps = {
	isStatic: true,
	render: { fillStyle: '#FFEEDB' },
	...friction,
};

const gameStatics = [
	// Left
	Bodies.rectangle(-(wallPad / 2), Game.height / 2, wallPad, Game.height, wallProps),

	// Right
	Bodies.rectangle(Game.width + (wallPad / 2), Game.height / 2, wallPad, Game.height, wallProps),

	// Bottom
	Bodies.rectangle(Game.width / 2, Game.height + (wallPad / 2) - statusBarHeight, Game.width, wallPad, wallProps),
];

// add mouse control
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
	mouse: mouse,
	constraint: {
		stiffness: 0.2,
		render: {
			visible: false,
		},
	},
});
render.mouse = mouse;

Game.initGame();

const resizeCanvas = () => {
	const screenWidth = document.body.clientWidth;
	const screenHeight = document.body.clientHeight;

	let newWidth = Game.width;
	let newHeight = Game.height;
	let scaleUI = 1;

	if (screenWidth * 1.5 > screenHeight) {
		newHeight = Math.min(Game.height, screenHeight);
		newWidth = newHeight / 1.5;
		scaleUI = newHeight / Game.height;
	} else {
		newWidth = Math.min(Game.width, screenWidth);
		newHeight = newWidth * 1.5;
		scaleUI = newWidth / Game.width;
	}

	render.canvas.style.width = `${newWidth}px`;
	render.canvas.style.height = `${newHeight}px`;

	Game.elements.ui.style.width = `${Game.width}px`;
	Game.elements.ui.style.height = `${Game.height}px`;
	Game.elements.ui.style.transform = `scale(${scaleUI})`;
};

document.body.onload = resizeCanvas;
document.body.onresize = resizeCanvas;

});