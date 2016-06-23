// Script: [script name]
// Developer: Gage Coates
// Date: [date]

// using the canvas
var canvas;
var ctx;
// assets
var paddleSheet = new Image();
paddleSheet.src = 'paddleSheet.png';
var ballSheet = new Image();
ballSheet.src = 'ballSheet.png';
var game;
// gets called once the html is loaded
function initalize() {
	// initalize the canvas variables
	canvas = document.getElementById('canvas');
	ctx = canvas.getContext('2d');
	// fit the canvas to the screen size
	ctx.canvas.width  = window.innerWidth-128;
	ctx.canvas.height = window.innerHeight-128;
	// rendering style
	ctx.lineWidth = 4;
	ctx.strokeStyle = 'black';
	// create the game
	game = new Game();
	game.Start();
}
// Game class
function Game() {
	// properties
	this.balls = [];
	this.paddles = [];
	this.powerUps = [];
	// animation variables
	this.animationRequest;
	this.timeOfLastFrame = Date.now();
	this.countDown = 0;
	// methods
	this.SpawnPaddlePowerUp = function(xPos,paddleY) {
		var self = this;
		// spawn power up
		if (Math.round(Math.random()*1) == 0) {
			var yPos;
			if (paddleY <= canvas.height/2) {
				yPos = canvas.height-32;
			} else {
				yPos = 32;
			}
			self.powerUps.forEach(function (power) {
				if (Math.abs(power.xPos-xPos) <= power.radius*2 && Math.abs(power.yPos-yPos) <= power.radius*2) {
					return;
				}
			})
			this.powerUps.push(new Power(xPos,yPos,'paddle',canvas.height/32));
		}
	}
	this.SpawnBallPowerUp =  function() {
		var self = this;
		if (Math.round(Math.random()*1) == 0) {
			var radius = canvas.height/32;
			var xPos = canvas.width/2;
			var yPos = Math.round(Math.random() * (canvas.height-radius*2) + radius);
			self.powerUps.forEach(function (power) {
				if (Math.abs(power.xPos-xPos) <= power.radius*2 && Math.abs(power.yPos-yPos) <= power.radius*2) {
					return;
				}
			})
			self.powerUps.push(new Power(xPos,yPos,'ball',radius));
		}
	}
	this.Start = function () {
		var self = this;
		// clear the objects
		if (self.animationRequest != undefined) {
			window.cancelAnimationFrame(self.animationRequest);
		}
		self.balls = [];
		self.paddles = [];
		self.powerUps = [];
		// add one ball
		self.balls.push(new Ball(canvas.width/2,canvas.height/2,1000,0,1000));
		// left and right paddles
		self.paddles.push(new Paddle(32,32,canvas.height * 0.25));
		self.paddles.push(new Paddle(canvas.width-32,32,canvas.height*0.25));
		document.getElementById('p0').innerHTML = '0';
		document.getElementById('p1').innerHTML = '0';
		self.NewRound(1);
		self.animationRequest = animation();
	}
	this.NewRound = function(direction) {
		var self = this;
		// reset powerUps
		self.powerUps = [];
		// reset balls
		self.balls = [];
		self.balls.push(new Ball(canvas.width/2,canvas.height/2,1000,0,1000));
		// reset paddle positions
		var old = this.paddles;
		self.paddles = [];
		// left and right paddles
		self.paddles.push(new Paddle(32,32,canvas.height * 0.25));
		self.paddles[0].score = old[0].score;
		self.paddles[0].AI();
		if (document.getElementById('leftPlayer').checked) {
			self.paddles[0].computer = true;
		}
		self.paddles.push(new Paddle(canvas.width-32,32,canvas.height*0.25));
		self.paddles[1].score = old[1].score;
		self.paddles[1].AI();
		if (document.getElementById('rightPlayer').checked) {
			self.paddles[1].computer = true;
		}
		// start the countDown
		self.countDown = 3;
	}
	this.Update = function () {
		var self = this;
		// update the time between frames
		var elapsed = (Date.now() - self.timeOfLastFrame)/1000;
		self.timeOfLastFrame = Date.now();
		self.countDown -= elapsed;
		if (self.countDown <= 0) {
			self.countDown = 0;
			// update each ball
			self.balls.forEach(function (ball,index) {
				// update positions
				self.balls[index].Update(elapsed);
				
				// check for collisions with paddles
				
				// Left paddle
				var paddle =  self.paddles[0];
				if (ball.xVel < 0 && ball.xPos-ball.radius < paddle.xPos+ paddle.width/2) {
					// check yPosition
					if (ball.yPos+ball.radius > paddle.yPos-paddle.height/2 && ball.yPos-ball.radius < paddle.yPos+paddle.height/2) {
						// calculate new yVel
						var deltaY = (ball.yPos - paddle.yPos)/(paddle.height/2);
						self.balls[index].yVel = deltaY*500;
						self.balls[index].xVel =  Math.sign(ball.xVel) * Math.sqrt(self.balls[index].Velocity * self.balls[index].Velocity - self.balls[index].yVel * self.balls[index].yVel);
						// bounce off
						self.balls[index].Collision((ball.xPos-ball.radius) - (paddle.xPos+paddle.width/2));
						// spawn paddle power up
						self.SpawnPaddlePowerUp(paddle.xPos,paddle.yPos);
						// spawn ball power up
						self.SpawnBallPowerUp();
						// trigger ai
						self.paddles[1].AI();
						return;
					} else {
						// point for right paddle
						self.paddles[1].score++;
						document.getElementById('p1').innerHTML = self.paddles[1].score;
						self.NewRound(Math.sign(ball.xVel));
						return;
					}
				}
				// Right paddle
				paddle = self.paddles[1];
				if (ball.xPos+ball.radius > paddle.xPos - paddle.width/2) {
					// check yPosition
					if (ball.yPos+ball.radius > paddle.yPos-paddle.height/2 && ball.yPos-ball.radius < paddle.yPos+paddle.height/2) {
						// calculate new velocities
						var deltaY = (ball.yPos - paddle.yPos)/(paddle.height/2);
						self.balls[index].yVel = deltaY*500;
						self.balls[index].xVel = Math.sign(ball.xVel) * Math.sqrt(self.balls[index].Velocity * self.balls[index].Velocity - self.balls[index].yVel * self.balls[index].yVel);
						// bounce off
						self.balls[index].Collision((ball.xPos+ball.radius) - (paddle.xPos-paddle.width/2));
						// spawn paddle power up
						self.SpawnPaddlePowerUp(paddle.xPos,paddle.yPos);
						// spawn ball power up
						self.SpawnBallPowerUp();
						// trigger ai
						self.paddles[0].AI();
						return;
					} else {
						// point for left paddle
						self.paddles[0].score++;
						document.getElementById('p0').innerHTML = self.paddles[0].score;
						self.NewRound(Math.sign(ball.xVel));
						return;
					}
				}
				// check for collision with powerUps
				self.powerUps.forEach(function (power, index) {
					if (Math.abs(ball.xPos-power.xPos) <= ball.radius + power.radius && Math.abs(ball.yPos-power.yPos) <= ball.radius + power.radius) {
						// use power
						switch (ballPowers[power.type]) {
						case 'largeBall':
							ball.Expand();
							break;
						case 'smallBall':
							ball.Shrink();
							break;
						case 'slowBall':
							ball.Slow();
							break;
						case 'fastBall' :
							ball.Fast();
							break;
						}
						self.powerUps.splice(index,1);
					}
				});
			});
			// update each paddle
			self.paddles.forEach(function (paddle, index) {
					if (paddle.computer) {
						self.paddles[index].AImove();
					} 
					self.paddles[index].Update(elapsed);
					// check for collision with powerUps
					self.powerUps.forEach(function (power, powerIndex) {
						if (Math.abs(paddle.xPos-power.xPos) <= paddle.width/2 + power.radius && Math.abs(paddle.yPos-power.yPos) <= paddle.height/2 + power.radius) {
							// use power
							switch (paddlePowers[power.type]) {
								case 'largePaddle':
									self.paddles[index].Expand();
									break;
								case 'smallPaddle':
									self.paddles[index].Shrink();
									break;
								case 'slowPaddle':
									self.paddles[index].Slow();
									break;
								case 'fastPaddle' :
									self.paddles[index].Fast();
									break;
							}
							self.powerUps.splice(powerIndex,1)
						}
					});
			});
			// update each power
			self.powerUps.forEach(function (power, index) {
				if (power.lifeTime <= 0) {
					self.powerUps.splice(index,1);
				} else {
					self.powerUps[index].Update(elapsed);
				}
				
			})
		}
	}
	this.Render = function () {
		var self = this;
		// clear the screen
		ctx.fillStyle = 'white';
		ctx.fillRect(0,0,canvas.width,canvas.height);
		// render the countDown
		document.getElementById('countDown').innerHTML = Math.ceil(self.countDown);
		// render each ball
		self.balls.forEach(function (ball,index) {
			self.balls[index].Render();
		});
		// render each paddle
		self.paddles.forEach(function(paddle,index) {
			self.paddles[index].Render();
		})
		// render each power
		self.powerUps.forEach(function (power, index) {
			self.powerUps[index].Render();
		})
	}
	this.SpawnPowerUp = function () {
		var type = Math.round(Math.random());
		if (type) {
			powerUps.push(new Power(Math.round(Math.random()-1) * canvas.width))
		}
	}
}
// Ball class
function Ball(xPos,yPos,xVel,yVel,Vel) {
	// properties
	this.xPos = xPos;
	this.yPos = yPos;
	this.xVel = xVel;
	this.yVel = yVel;
	this.Velocity = Vel;
	this.radius = canvas.height/32;
	this.color = 'red';
	// methods
	this.Slow = function ()  {
		if (Math.abs(this.xVel) > 500) {
			this.xVel /= 1.5;
			this.yVel /= 1.5;
			this.Velocity = Math.sqrt(this.yVel*this.yVel+this.xVel*this.xVel);
		}
	}
	this.Fast = function () {
		if (Math.abs(this.xVel) < 1000) {
			this.xVel *= 1.5;
			this.yVel *= 1.5;
			this.Velocity = Math.sqrt(this.yVel*this.yVel+this.xVel*this.xVel);
		}
	}
	this.Expand = function() {
		this.radius *= 1.5;
		if (this.radius > canvas.height/2) {
			this.radius = canvas.height/2;
		}
	}
	this.Shrink = function() {
		this.radius /= 1.5;
		if (this.radius < canvas.height/64) {
			this.radius =  canvas.height/64;
		}
	}
	this.Update = function (time) {
		this.xPos += this.xVel * time;
		this.yPos += this.yVel * time;
		// vertical collision
		if (this.yPos-this.radius < 0) {
			this.yPos = this.radius;
			this.yVel *= -1;
		} else if (this.yPos+this.radius > canvas.height) {
			this.yPos = canvas.height-this.radius;
			this.yVel *= -1;
		}
	}
	this.Collision = function (deltaX) {
		this.xPos += -deltaX;
		this.xVel *= -1;
	}
	this.Render = function () {
		var self = this;
		ctx.fillStyle = self.color;
		ctx.beginPath();
		ctx.arc(self.xPos,self.yPos,self.radius,0,2*Math.PI);
		ctx.fill();
		ctx.stroke();
	}
}
// Paddle class
function Paddle(xPos,width,height) {
	// properties
	this.xPos = xPos;
	this.yPos = canvas.height/2;
	this.yVel = 1000;
	this.width = width;
	this.height = height;
	this.color = 'green';
	this.computer = false;
	// user
	this.up = false;
	this.down = false;
	this.score = 0;
	this.AIyPos = canvas.height/2;
	this.lastPos = canvas.height/2;
	// methods
	this.Slow = function ()  {
		this.yVel /= 1.5;
		if (Math.abs(this.yVel) < 500) {
			this.yVel = 500;
		}
	}
	this.Fast = function () {
		this.yVel *= 1.5;
		if (Math.abs(this.yVel) > 1500) {
			this.yVel = 1500;
		}
	}
	this.Expand = function() {
		this.height *= 1.5;
		if (this.height > canvas.height/2) {
			this.height = canvas.height/2;
		}
	}
	this.Shrink = function() {
		this.height /= 1.5;
		if (this.height < 32) {
			this.height = 32;
		}
	}
	this.Update = function(time) {
		if (this.up && ! this.down && this.yPos-this.height/2 > 0) {
			this.yPos += -this.yVel * time;
			if (this.yPos-this.height/2 < 0) {
				this.yPos = this.height/2;
			}
		} else if (this.down && !this.up && this.yPos+this.height/2 < canvas.height) {
			this.yPos += this.yVel * time;
			if (this.yPos+this.height/2 > canvas.height) {
				this.yPos = canvas.height-this.height/2;
			}
		}
	}
	this.Render = function() {
		ctx.fillStyle = this.color;
		ctx.fillRect(this.xPos-this.width/2,this.yPos-this.height/2,this.width,this.height);
	}
	this.AI = function() {
		// calculate where the ball will be when it reaches this paddle
		var ball = game.balls[0];
		var slope = ball.yVel/ball.xVel;
		// find the first impact
		if (this.xPos < canvas.width/2) {
			slope *= -1;
		}
		var yPos = slope > 0 ? canvas.height-ball.radius: 0+ball.radius;
		if (this.xPos < canvas.width/2) {
			slope *= -1;
		}
		var xPos = (yPos - ball.yPos) / slope + ball.xPos;

		// keep on bouncing the ball
		while (xPos > 0 && xPos < canvas.width) {
			slope *= -1;
			if (this.xPos < canvas.width/2) {
			slope *= -1;
		}
			var impactY = slope > 0 ? canvas.height-ball.radius: 0+ball.radius;
			if (this.xPos < canvas.width/2) {
			slope *= -1;
		}
			xPos = (impactY - yPos) / slope + xPos;
			yPos = impactY;
		}
		// find where the ball will hit the paddle
		var impactX = xPos < 0 ? 0 : canvas.width;
		this.AIyPos = Math.round( slope * (impactX - xPos) + yPos);
		if (!(this.AIyPos < canvas.height && this.AIyPos > 0)) {
			this.AIyPos = canvas.height/2;
		}
		// add some randomness
		this.AIyPos += Math.sign(Math.random()-0.5) * this.height/3;
	}
	this.AImove = function() {
		if (this.lastPos > this.AIyPos && this.yPos > this.AIyPos) {
			this.up = true;
			this.down = false;
			this.lastPos = this.yPos;
		} else if (this.lastPos < this.AIyPos && this.yPos < this.AIyPos) {
			this.down = true;
			this.up = false;
			this.lastPos = this.yPos;
		} else {
			this.up = false;
			this.down = false;
		}
	}
}
var  ballPowers = ['largeBall','smallBall','fastBall','slowBall'];
var  paddlePowers = ['largePaddle','smallPaddle','fastPaddle','slowPaddle'];
// Power Up class
function Power(xPos,yPos,type,radius) {
	this.xPos = xPos;
	this.yPos = yPos;
	this.typeClass = type;
	 var source = type == 'paddle' ? paddlePowers : ballPowers;
	this.type = Math.round(Math.random()*(source.length-1));
	this.radius = radius;
	this.lifeTime = 4; // seconds
	this.Update = function (time) {
		this.lifeTime -= time;
	}
	this.Render = function () {
		var sy = Math.floor(this.type / 4);
		var sx = this.type - (sy * 4);
		if (this.typeClass == 'paddle') {
			ctx.drawImage(paddleSheet,sx*64,sy*64,64,64,this.xPos-this.radius,this.yPos-this.radius,this.radius*2,this.radius*2);
		} else {
			ctx.drawImage(ballSheet,sx*64,sy*64,64,64,this.xPos-this.radius,this.yPos-this.radius,this.radius*2,this.radius*2);
		}
		
	}
}
window.requestAnimFrame = (function () {
	return window.requestAnimationFrame ||
	window.webkitRequestAnimationFrame ||
	window.mozRequestAnimationFrame ||
	function (callback) {
		window.setTimeout(callback, 1000/60);
	};
})();
function animation() {
	game.Update();
	game.Render();
	window.requestAnimFrame(animation);
}
window.addEventListener('keydown', function (evt) {
	var code = evt.keyCode;
	if (code == 87) {
		game.paddles[0].up = true;
	} else if (code == 83) {
		game.paddles[0].down = true;
	} else if (code == 38) {
		game.paddles[1].up = true;
	} else if (code == 40) {
		game.paddles[1].down = true;
	}
	
	evt.preventDefault();
    evt.stopPropagation();
    evt.cancelBubble = true;
    return false;
})
window.addEventListener('keyup', function (evt) {
	var code = evt.keyCode;
	if (code == 87) {
		game.paddles[0].up = false;
	} else if (code == 83) {
		game.paddles[0].down = false;
	} else if (code == 38) {
		game.paddles[1].up = false;
	} else if (code == 40) {
		game.paddles[1].down = false;
	}
})
