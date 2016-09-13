var ARPlayer = cc.Sprite.extend({

	_velocity: cc.p(0,0),
	_onGround: false,
	_desiredPosition: cc.p(0,0),
	_gravity: cc.p(0.0, -100.0),
	_collisionBoundingBox: null,
	_desiredPosition: cc.p(100,400),
	_forwardMarch: false,
	_mightAsWellJump: false,

	ctor: function (texture) {
		this._super(texture);

		this._collisionBoundingBox = cc.rect(0, 0, this.getBoundingBox().width, this.getBoundingBox().height);
		return this;
	},
 	
 	updatea: function(dt) { 	
	 	let jumpForce = cc.p(0.0, 310.0);
	    let jumpCutoff = 150.0;
	    
	    if (this._mightAsWellJump && this._onGround) {
	        this._velocity = cc.pAdd(this._velocity, jumpForce);
	        console.log("Jump =>>>>>>>");
	        // Sound jump
	    } 
	    else if (!this._mightAsWellJump && this._velocity.y > jumpCutoff) {
	        this._velocity = cc.p(this._velocity.x, jumpCutoff);
	    }
	    
	    let forwardMove = cc.p(800.0, 0.0);
	    let forwardStep = cc.pMult(forwardMove, dt);
	    
	    this._velocity = cc.p(this._velocity.x * 0.90, this._velocity.y);
	    
	    // if (this._forwardMarch) {
	        this._velocity = cc.pAdd(this._velocity, forwardStep);
	    // } 
	    
	    let minMovement = cc.p(5.0, -450.0);
	    let maxMovement = cc.p(120.0, 250.0);

	    let gravityStep = cc.p(0,0);
	    if (!this._onGround)
	    	gravityStep = cc.pMult(this._gravity, dt);

	    this._velocity = cc.pClamp(this._velocity, minMovement, maxMovement);
    
	    this._velocity = cc.pAdd(this._velocity, gravityStep);
	    this._velocity.x = 200;
	    
	    let velocityStep = cc.pMult(this._velocity, dt);

 		let position = cc.p(this.getPosition().x, this.getPosition().y);
 		this._desiredPosition = cc.pAdd(position, velocityStep);
 	},

 	setGravity: function(gravity) {
 		this._gravity = gravity;
 	},

 	getCollisionBoundingBox: function() {
 		let boundingBox = this.getBoundingBox();
 		// let diffBoundingBox = cc.pSub(this._desiredPosition, this.getPosition());
 		let boundingBoxRect = cc.rect(this.getPosition().x - boundingBox.width / 2, this.getPosition().y - boundingBox.height / 2, boundingBox.width, boundingBox.height);
 		return boundingBoxRect;
 	},

 	onGround: function() {
 		return this._onGround;
 	},

 	setOnGround: function(onGround) {
 		this._onGround = onGround;
 	},

 	getVelocity: function() {
 		return this._velocity;
 	},

 	setVelocity: function(velocity) {
 		this._velocity = velocity;
 	},

 	getDesiredPosition: function(){
 		return this._desiredPosition;
 	},

 	setDesiredPosition: function(desiredPosition) {
 		cc.log("setDesiredPosition: %d, %d", desiredPosition.x, desiredPosition.y);
 		this._desiredPosition = desiredPosition;
 	},

 	getForwardMarch: function(){
 		return this._forwardMarch;
 	},

 	setForwardMarch: function(forwardMarch) {
 		this._forwardMarch = forwardMarch;
 	},

 	getMightJump: function(){
 		return this._mightAsWellJump;
 	},

 	setMightJump: function(mightAsWellJump) {
 		this._mightAsWellJump = mightAsWellJump;
 	},
});