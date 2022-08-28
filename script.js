var width = 0, height = 0;
var accelerate = 1;

var start = function() {
	var canvas = document.getElementById('obszar');
	var context;

	var lifeTime = 0;

	var init = function() {
		var w = window,
		d = document,
		e = d.documentElement,
		g = d.getElementsByTagName('body')[0];
		width = w.innerWidth || e.clientWidth || g.clientWidth;
		height = w.innerHeight|| e.clientHeight|| g.clientHeight;

		canvas.width = width;
		canvas.height = height;
		context = canvas.getContext('2d', {antialias: true});

		context.lineCap = 'round';
		context.lineJoin = "round";
		context.lineWidth = 0.1;
		context.strokeStyle = 'rgb(150, 255, 255)';
		context.fillStyle = 'rgb(255, 100, 100)';

		context.globalCompositeOperation = 'screen';//blending

		context.font = 'normal ' + (height / 20) + 'px helvetica';
	};
	
	var points = [];
	var player;

	var prepare = function() {
		//inputowanie
		var onKeyDown = function(event) {
			//console.log(event.keyCode);
			if(event.keyCode == 65 || event.keyCode == 37)
				player.left = true;
			if(event.keyCode == 68 || event.keyCode == 39)
				player.right = true;
		};
		var onKeyUp = function(event) {
			if(event.keyCode == 65 || event.keyCode == 37)
				player.left = false;
			if(event.keyCode == 68 || event.keyCode == 39)
				player.right = false;
		};
		document.addEventListener('keydown', onKeyDown, false);
		document.addEventListener('keyup', onKeyUp, false);
		//przygotowanie canvasa
		init();

		for(var i=0; i<50; i++) {
			points.push(new Point((Math.random()-0.5)*width/height, Math.random()-0.5));
		}
		player = new Player(0, 0);
	};
	prepare();
	var update = function(delta) {
		if(delta > 0.5 || player.hp < 0) {
			delta = 0;
			return;
		}
		context.clearRect(0, 0, width, height);
		if(player.hp >= 0) {
			if(Math.floor(lifeTime) < Math.floor(lifeTime+delta)) {
				points.push(new Point((Math.random()-0.5)*width/height, Math.random()-0.5));
				accelerate += 0.02;
			}
			lifeTime += delta;
			player.update(delta);
			player.draw(context);
		}
		for(var i=0; i<points.length; i++) {
			points[i].update(delta);
			points[i].draw(context);
			for(var j=0; j<points.length; j++) {
				var dst = getDistance(points[i].pos, points[j].pos);
				//console.log(dst);
				if(i != j && dst < 0.2) {
					if(circleLineIntersect(points[i].pos, points[j].pos, player.shape.pos, player.shape.radius)) {
						context.strokeStyle = 'rgb(255, 100, 100)';
						context.lineWidth = 2;
						player.hp -= 20*delta;
					}
					else {
						context.strokeStyle = 'rgb(150, 255, 255)';
						context.lineWidth = (0.2-dst)*2;
					}
					
					drawLine(context, points[i].pos, points[j].pos);
				}
			}
		}
		//drawing text
		context.fillText("HP: " + Math.floor(player.hp) + "%", 0, height/20);
		context.fillText("Time: " + Math.floor(lifeTime) + " sec", 0, height/20*2);
	};

	window.requestAnimFrame = (function(){
		return  window.requestAnimationFrame     || 
		      window.webkitRequestAnimationFrame || 
		      window.mozRequestAnimationFrame    || 
		      window.oRequestAnimationFrame      || 
		      window.msRequestAnimationFrame     || 
		      function(/* function */ callback, /* DOMElement */ element){
		        window.setTimeout(callback, 1000 / 60);
		      };
    })();

    var time_old = 0;
	var animate  = function(time) {
		var dt = time-time_old;//delta time
		time_old = time;

		//for(var i=0; i<5; i++)
			update(dt/1000);

		requestAnimFrame(animate);
	};
	animate(0);

	var onWindowResize = function() {
		/*var w = window,
		d = document,
		e = d.documentElement,
		g = d.getElementsByTagName('body')[0];
		width = w.innerWidth || e.clientWidth || g.clientWidth;
		height = w.innerHeight|| e.clientHeight|| g.clientHeight;*/
		init();
	};
	window.addEventListener('resize', onWindowResize, false);
};

var Vec2 = function(x, y) {
	this.x = x;
	this.y = y;
};
var Vec3 = function(x,y,z) {
	this.x = x;
	this.y = y;
	this.z = z;
};

var Point = function(x, y) {
	this.pos = new Vec2(x, y);
	//this.lifetime = 5;
	this.angle = Math.PI*2 * Math.random();
	this.speed = 0.04;
	this.radius = 0.002;
};
Point.prototype.update = function(delta) {
	this.angle += (Math.random()-0.5)*delta*2.5;
	this.pos.x += Math.cos(this.angle)*this.speed*delta*accelerate;
	this.pos.y += Math.sin(this.angle)*this.speed*delta*accelerate;
	if(this.pos.y > 0.5)
		this.pos.y = -0.5;
	if(this.pos.y < -0.5)
		this.pos.y = 0.5;
	if(this.pos.x > 0.5*(width/height))
		this.pos.x = -0.5*(width/height);
	if(this.pos.x < -0.5*(width/height))
		this.pos.x = 0.5*(width/height);
};
Point.prototype.draw = function(ctx) {
	drawCircle(ctx, this.pos.x, this.pos.y, this.radius);
};

var Player = function(x, y) {
	this.shape = new Point(x, y);
	this.shape.radius = 0.02;
	this.shape.speed = 0.1;
	this.shape.angle = -Math.PI/2;

	//sterowanie
	this.left = false;
	this.right = false;
	this.turnPower = toRadians(270);//o ile stopni gracz moze sie obrocic w ciagu sekundy

	this.hp = 100;
};
Player.prototype.update = function(delta) {
	if(this.left)
		this.shape.angle -= this.turnPower * delta;
	if(this.right)
		this.shape.angle += this.turnPower * delta;

	this.shape.pos.x += Math.cos(this.shape.angle)*this.shape.speed*delta*accelerate;
	this.shape.pos.y += Math.sin(this.shape.angle)*this.shape.speed*delta*accelerate;

	/*if(this.shape.pos.y > 0.5) {
		this.shape.angle = -this.shape.angle;
	}
	if(this.shape.pos.y < -0.5)
		this.shape.angle = -this.shape.angle;
	if(this.shape.pos.x > 0.5*(width/height))
		this.shape.angle = -(this.shape.angle-90) + 90;
	if(this.shape.pos.x < -0.5*(width/height))
		this.shape.angle = -(this.shape.angle-90) + 90;*/
	if(this.shape.pos.y > 0.5)
		this.shape.pos.y = -0.5;
	if(this.shape.pos.y < -0.5)
		this.shape.pos.y = 0.5;
	if(this.shape.pos.x > 0.5*(width/height))
		this.shape.pos.x = -0.5*(width/height);
	if(this.shape.pos.x < -0.5*(width/height))
		this.shape.pos.x = 0.5*(width/height);

	this.hp += delta;
	if(this.hp > 100)
		this.hp = 100;
};
Player.prototype.draw = function(ctx) {
	drawCircle(ctx, this.shape.pos.x, this.shape.pos.y, this.shape.radius);
};

var drawCircle = function(ctx, x, y, radius) {
	ctx.beginPath();
	//ctx.arc(width/2 - height/2 + x*height, y*height, radius*height, 0, Math.PI*2, false);
	ctx.arc(width/2+x*height, height/2+y*height, height*radius, 0, Math.PI*2, false);
	ctx.fill();
};

var drawLine = function(ctx, start, end) {
	ctx.beginPath();
	ctx.lineTo(width/2+start.x*height, height/2+start.y*height);
	ctx.lineTo(width/2+end.x*height, height/2+end.y*height);
	ctx.stroke();
};

var getDistance = function(p1, p2) {
	return Math.sqrt(Math.pow(p1.x-p2.x, 2) + Math.pow(p1.y-p2.y, 2));
};

var toRadians = function(deg) {
	return deg/180*Math.PI;
};

var circleLineIntersect = function(pa, pb, center, radius) {//pa - start line, pb - end line, center - circle center, radius - radius of circle
	if(center.x+radius < Math.min(pa.x, pb.x) || center.x-radius > Math.max(pa.x, pb.x) || center.y+radius < Math.min(pa.y, pb.y) || center.y-radius > Math.max(pa.y, pb.y))
		return false;
	var a = (pa.y-pb.y)/(pa.x-pb.x);
	var b = pa.y-(pa.x*a);
	var dst = Math.abs(a*center.x - center.y+b) / Math.sqrt(a*a + 1);
	return dst <= radius;
}