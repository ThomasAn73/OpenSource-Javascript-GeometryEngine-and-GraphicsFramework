//+++++++++++++++++++++++++++
//Author: Thomas Androxman
//Date  : Oct/2017
//+++++++++++++++++++++++++++
//This Library has: TypeCamera, TypeTmatrix, TypeXYZw, TypeCamera2D, TypeKinematics, TypeColor, TypeOscillator, TypeSlider, IsArray, GetCSScolor, GetArrRGB, Say, InitCanvas, ClipValue
//                    TypeSurface, TypeSurfaceNormals, TypeSurfaceTextureCoord, TypePolyline, TypeBezierCurve
//                    TypeMaterial
//NOTE: This library is kept *theoretical* and fundamental; building blocks for other libraries. (Does not contain HTML specific functions (canvas etc), or WebGL specific.) 
//+++++++++++++++++++++++++++

//===================================================================================================================================================
//Global Constants-----------------------------------------------------------------------------------------------------------------------------------
var   epsilon    = 0.001;
const degToRad   = 0.017453292519943295769236907684886127134428718885417;
const radToDeg   = 57.295779513082320876798154814105170332405472466564; 
const pi         = 3.1415926535897932384626433832795028841971693993751;
const primes     = [2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97,101,103,107,109,113,127,131,137,139,149,151,157,163,167,173,179,181,191,193,197,199,211,223,227,229,233,239,241,251,257,263,269,271,277,281,283,293,307,311,313,317,331,337,347,349,353,359,367,373,379,383,389,397,401,409,419,421,431,433,439,443,449,457,461,463,467,479,487,491,499,503,509,521,523,541,547,557,563,569,571,577,587,593,599,601,607,613,617,619,631,641,643,647,653,659,661,673,677,683,691,701,709,719,727,733,739,743,751,757,761,769,773,787,797,809,811,821,823,827,829,839,853,857,859,863,877,881,883,887,907,911,919,929,937,941,947,953,967,971,977,983,991,997];

//===================================================================================================================================================
//Global variables-----------------------------------------------------------------------------------------------------------------------------------
var sysTimeStamp = Date.now();   //In milliseconds
var sessionTimer = 0;
var deltaT       = 0.01;
//---------------------------------------------------------------------------------------------------------------------------------------------------

//===================================================================================================================================================
//Global Functions-----------------------------------------------------------------------------------------------------------------------------------
function IsArray  (thisThing) {return Array.isArray(thisThing);}
function IsString (thisThing) {return (typeof thisThing == 'string' || (thisThing instanceof String));} 
function GetCSScolor (ColorArr) 
{  //Convert a regular array of values to a CSS color string
   if (ColorArr instanceof TypeXYZw) {ColorArr = ColorArr.GetAsArray();}
   if (!IsArray(ColorArr) || ColorArr.length<3) {return "rgb(0,0,0)"; }
   else if (ColorArr.length>=4) {return "rgba("+Number(ColorArr[0])+","+Number(ColorArr[1])+","+Number(ColorArr[2])+","+Number(ColorArr[3])+")";}
   else                         {return "rgb(" +Number(ColorArr[0])+","+Number(ColorArr[1])+","+Number(ColorArr[2])+")";}
}
function GetArrRGB (CSScolorStr)
{  //Convert a CSS color string to an array of numerical values
   var result = CSScolorStr.match(/\d+/g); //RegExp /..../ It contains operant \d (find digit), contains + (find all digits, not just one), ends with the g modifier (find all matches rather than stopping after the first match)
   var count  = result.length;
   for (var i=0;i<count;i++) result[i]=Number(result[i]);
   return result;
}
function ArrCompare(arr1,arr2)
{   //Compare two arrays value by value
    if (!IsArray(arr1) || !IsArray(arr2)) return false;
    var count = arr1.length;
    if (count!=arr2.length) {return false;}
    for (var i=0;i<count;i++) {if (arr1[i]!=arr2[i]) return false;}
    return true;
}
function Say (userSays,elementID)
{   //Print a message; either to a specificly supplied ID of an HTML element, or to the console
    var defaultElementID = "PrintOut";                            //Default HTML element (by convention)
    if (elementID === void(0)) {elementID = defaultElementID;}  //if none given use default
    var OutputHTMLelement = document.getElementById(elementID); //document.getElementById always expects a string (so numbers will return null)

    //Printing to the document
    if (OutputHTMLelement!==null) {OutputHTMLelement.innerHTML = userSays; return;}

    //Printing to the console
    console.log (userSays); 
}
function ClipValue (x,max,min)
{   //Constrain x within min, max

    //Note: x==NaN or x===Nan do not work as expected. Number.isNaN(x) is idial and instanteneous
    //Note: Number(x) is extremely fast for actual numbers (infinitescimal performance hit)
    //Note: isNaN(x) is relatively expensive 
    
    if (min===void(0)) {min=0;} 
    if (max===void(0)) {max=min+1;} 
    if (min>max) {let t=max; max=min; min=t;}
    if (x<min) {x=min;} else if (x>max) {x=max;}
    return x;
}
function ClipValue2 (x,max,min)
{   //clean and constrain x within min, max

    //Note: x==NaN or x===Nan do not work as expected. Number.isNaN(x) is idial and instanteneous
    //Note: Number(x) is extremely fast for actual numbers (infinitescimal performance hit)
    //Note: isNaN(x) is relatively expensive 
    
    x = Number(x); max = Number(max); min = Number(min);
    if (Number.isNaN(min)) {min=0;} if (Number.isNaN(max)) {max=min+1;} if (min>max) {let t=max; max=min; min=t;}
    if (x<min || Number.isNaN(x)) {x=min;} else if (x>max) {x=max;}
    return x;
}
function GetPathComponents (customPath)
{    //Splits the path into a root substring and a filename substring (default path is where the calling HTML file located)
    var path = (customPath===void(0))? location.href : customPath; //location.href returns the full path to the calling HTML file
    var lastSlashIdx     = path.lastIndexOf('/');
    return {rootDir:path.substring(0,lastSlashIdx+1), fileName:path.substring(lastSlashIdx+1)};
}
//===================================================================================================================================================
//Classes / Constructor-functions
//---------------------------------------------------------------------------------------------------------------------------------------------------
function TypeSlider (trvLength,T,asSpring)
{  //This object slides numerically from stowed to a deployed state within a range (it doesn't draw anything). If elastic, it will remain active until it comes to a rest.

   var isElastic;     //Slider behaves as a spring
   var deploy;        //boolean (command)
   var condition;     //Silder state --> 0:stowed, 1:deployed and resting, 0.5:in motion
   
   var travel;        //Total length if slider (or length of spring when deployed and at rest)
   var deflection;    //How compressed it is (distance from deployed state)
   var kCoef;         //Spring coefficient
   var bCoef;         //Drag coefficient
   var currPos;       //active location
   var posRatio;      //percent to full travel
   
   var initVel, velocity, minAccel, minVel;
   
   //Methods ---------------------
   var Initialize = function (travelLength,period,elastic)
   {
       isElastic  = (elastic)? true : false;
       deploy     = false;
       condition  = 0; 
       
       travel     = travelLength;  
       deflection = travel;        
       kCoef      = (elastic==false)? 0 : Math.pow((2*pi)/period,2);  // T = 2*pi*sqrt(m/k) --> k = ((2*pi)/T)^2
       bCoef      = Math.sqrt(kCoef)*0.8;
       currPos    = 0; //from 0 to 'travel'
       posRatio   = 0; //from 0 to 1
       
       initVel    = travelLength/period;
       velocity   = (elastic==true)? 0 : initVel;
       minVel     = 0.015 * initVel;
       minAccel   = kCoef * Math.abs(0.002*travel);
   }
   var CalculateState = function ()
   {
      if ((deploy==false && condition==0) || (deploy==true && condition==1)) return;
      if (isElastic==true && deploy==true) CalculateStateAsSpring(); else CalculateStateAsSimple();
      posRatio = currPos/travel;
      
   }
   var CalculateStateAsSpring = function ()
   {  //Note: deltaT is a global var
   
      //before deltaT
      deflection  = travel - currPos;
      var drag    = bCoef * velocity;             //dampening-deceleration: F = bCoef * vel
      var accAt0  = kCoef * deflection - drag;    //accelation
      if (Math.abs(accAt0)<minAccel && Math.abs(velocity)<minVel) {condition=1;velocity=0; currPos=travel; return;} else {condition=0.5;} 
      
      //after deltaT
      currPos     = (currPos==0)? accAt0 * deltaT * deltaT /2 : currPos + (velocity * deltaT);
      velocity   += (accAt0 * deltaT);            //new velocity
   }
   var CalculateStateAsSimple = function ()
   {
      var deltaX, speed;
      if (deploy == false) speed = -velocity; else speed = velocity;
      
      deltaX = speed * deltaT;
      currPos += deltaX;
      if (currPos>travel) {currPos=travel; condition=1;} else if (currPos<0) {currPos=0; condition=0;} else {condition=0.5;}
   }
   this.SetDeploy     = function (toThis)  
   {
      if(deploy==toThis) return; else deploy=toThis;  //proceed only if different
      if(deploy==false || (deploy==true && isElastic==false)) {velocity=initVel;} else {velocity=0;}
   }
   this.IsActive      = function ()        {return (condition>0 || deploy==true)? true : false;}
   this.IsInMotion    = function ()        {return condition==0.5;}
   this.IsStowed      = function ()        {return condition==0;}
   this.IsExtended    = function ()        {return condition==1;}
   this.UpdateState   = function ()        {CalculateState(); return posRatio;}
   this.GetDeploy     = function ()        {return deploy;}
   this.GetState      = function ()        {return posRatio;}
   this.GetPosition   = function ()        {return currPos;}
   this.GetDeflection = function ()        {return deflection;}
   this.GetCondition  = function ()        {return condition;}
   this.GetMaxTravel  = function ()        {return travel;}
   
   this.toString = function () {return '[object TypeSlider]\nCurrentPos='+posRatio+', Condition='+condition+', Deployed='+deploy+', Elastic='+isElastic+']\n';}
   
   Initialize(trvLength,T,asSpring);
}
//---------------------------------------------------------------------------------------------------------------------------------------------------
function TypeOscillator (something,repeat,waveShift,startAtTime)
{  //Varies from 0 to 1. This object is essentially a little piston (cosine function) used as heartbeat for oscilating movements or behaviors (such as color fades, etc)

   //var timeStamp = sessionTimer;
   //Private properties ----------------
   var period;          //time (ticks) for a cycle to complete
   var maxCycles;       //Note: 1 cycle means start-state and end-state are the same. 0.5 cycle is a fade. (Infinity: repeat forever, 0:deactivate oscillator, 1: one cycle only, n: so many cycles)
   var offset;          //shift the waveform left or right essentially changing its starting state
   var timer       = 0;
   
   var state;           //the state of the oscilator wave (from 0 to 1; this is the output value
   var cycleCount  = 0; //how many cycles have currently been completed
   var isActive;        //Is the oscillator running or has it passed its maxCycles
   
   //Private methods -------------------
   var CalculateState = function ()
   {  
      if (isActive==false) {return;} //Save same CPU time
      
      cycleCount = (timer+deltaT)/period;
      if ( cycleCount>maxCycles) {timer=maxCycles*period; cycleCount=maxCycles; isActive=false;} //if next tick will cross over the MaxCycles, oscillator should end in a precise state

      //var dt = (sessionTimer-timeStamp)/100; timeStamp=sessionTimer;
      var angleTheta = (2*Math.PI) * ((timer+offset)/period); //In radians. Full period is 2*pi radians
      state   = (1+Math.cos(angleTheta))/2; //cosine goes from -1 to 1 -->  1+cos goes from 0 to 2 --> so you divide by 2 to get a 0-1 oscillation
      
      //Uptick
      if (maxCycles!=0) timer += deltaT; else isActive=false; //When MaxCycles=0 the state is calculated exactly one time at the beginning during initialization
   }
   
   //Public methods ---------------------
   this.GetTimer     = function ()        {return timer;}
   this.GetPeriod    = function ()        {return period;}
   this.GetMaxCycles = function ()        {return maxCycles;}
   this.GetOffset    = function ()        {return offset;}
   this.GetCounter   = function ()        {return cycleCount;}
   this.GetState     = function ()        {CalculateState(); return state; }
   this.GetIsActive  = function ()           {return isActive;}
   this.Restart      = function ()        {timer=0; CalculateState();}
   this.SetEqualTo   = function (other)   {this.Set(other);}
   this.Set          = function (X,r,o,t)
   {       
      if (X instanceof TypeOscillator) { period = X.GetPeriod(); maxCycles = X.GetMaxCycles(); offset = X.GetOffset(); timer = X.GetTimer(); state = X.GetState(); isActive = X.GetIsActive(); return; }
      if (IsArray(X)) { t = X[3]; o = X[2]; r = X[1]; X = X[0]; }
      
      timer     = isNaN(t)? 0 : Number(t);
      period    = isNaN(X)? 2 : Number(X);
      maxCycles = isNaN(r)? 0 : Number(r);
      offset    = isNaN(o)? 0 : ((Number(o)*10)%(period*10))/10; //ensure offset is always less than the period (the 10 thing is for precision purposes)
      isActive  = true;
      
      CalculateState();
   }
   this.toString  = function () {return '[Object TypeOscillator] (period:'+period+', MaxCycles:'+maxCycles+', Offset:'+offset+', Timer ticks:'+timer+', STATE:'+state+')\n';}
   
   //Initialization
   this.Set(something,repeat,waveShift,startAtTime);
}
//---------------------------------------------------------------------------------------------------------------------------------------------------
function TypeColor (userX,userG,userB,userA,clipTo,scaleTo)
{  //Color object 

   //PRIVATE properties --------------------------------
   var MaxRange;    //if it is 1 then the values are all percentages (floats)
   var R,G,B,A;     //These values all hold floating numbers (not integers) maintaining accuracy internally (especially for RGB - HSL conversions)
                    //For the alpha value: 1=opaque, 0=transparent
   
   
   //PRIVATE methods -----------------------------------
   var ConvertRGBtoHSL = function ()
   {
       var percentR, percentG, percentB, min, max, resultH, resultS, resultL;

       if (MaxRange>1) {percentR=R/MaxRange;percentG=G/MaxRange;percentB=B/MaxRange;} else {percentR=R;percentG=G;percentB=B;}
       
       min=percentR;
       max=percentR;
       if (percentG<min) min=percentG;
       if (percentG>max) max=percentG;
       
       if (percentB<min) min=percentB;
       if (percentB>max) max=percentB;
       
       resultL = 100*(min+max)/2;
       if (resultL<=50) {resultS=100*(max-min)/(max+min);} else {resultS=100*(max-min)/(2.0-max-min);}
       if      (percentR==max) {resultH=(percentG-percentB)/(max-min);}
       else if (percentG==max) {resultH=2.0+(percentB-percentR)/(max-min);}
       else                    {resultH=4.0+(percentR-percentG)/(max-min);}
       
       resultH=resultH*60; if (resultH<0) resultH+=360;
       
       return [resultH,resultS,resultL];
   }
   
   //PUBLIC methods ------------------------------------
   this.MultiplyWith   = function (scalar)     {return new TypeColor(R*scalar,G*scalar,B*scalar,A,MaxRange);}
   this.GetArrRGB      = function (isRaw,norm) {var ratio = (norm)? 1/MaxRange : 1; return (isRaw==true || MaxRange==1)? [R*ratio,G*ratio,B*ratio,A*ratio] : [Math.round(R*ratio),Math.round(G*ratio),Math.round(B*ratio),A];}
   this.GetStrRGB      = function (isRaw)      {var ratio = 255/MaxRange; return (isRaw==true)? "rgb(" +R+","+G+","+B+")" : "rgb(" +Math.round(R*ratio)+","+Math.round(G*ratio)+","+Math.round(B*ratio)+")";}
   this.GetCSScolor    = function (isRaw)      {var ratio = 255/MaxRange; return (isRaw==true)? "rgba(" +R+","+G+","+B+","+A+")" : "rgba(" +Math.round(R*ratio)+","+Math.round(G*ratio)+","+Math.round(B*ratio)+","+A+")";}
   this.GetR           = function (isRaw)      {return (isRaw==true || MaxRange==1)? R : Math.round(R);}
   this.GetG           = function (isRaw)      {return (isRaw==true || MaxRange==1)? G : Math.round(G);}
   this.GetB           = function (isRaw)      {return (isRaw==true || MaxRange==1)? B : Math.round(B);}
   this.GetA           = function ()           {return A;} //1=opaque, 0=transparent
   this.GetAlpha       = function ()           {return A;} //Synonym to GetA()
   this.GetMaxRange    = function ()           {return MaxRange;}
   this.GetArrHSL      = function ()           {return ConvertRGBtoHSL();}  
   this.GetCSScolorHSL = function ()           {var arrHSL = this.GetArrHSL(); return "hsl("+arrHSL[0]+","+arrHSL[1]+"%,"+arrHSL[2]+"%)";}
   this.GetClone       = function ()           {return new TypeColor(R,G,B,A,MaxRange);}
   
   this.SetAsPercent   = function (isPercent)   
   {   //Defaults to true if nothing given
       if (isPercent===void(0) || isPercent) {this.SetMaxRange(1,true);}
       else if (!isPercent && MaxRange==1) {this.SetMaxRange(255,true);}
   }
   this.SetMaxRange    = function (newRange, resize)
   {   //Expects that 'newRange' is a number and 'resize' is a boolean
       //'resize' means that setting the MaxRange will propoertionally adjust the R,G,B values (otherwise the values are merely clipped or stay the same)
   
       if (isNaN(newRange) || newRange<0 || newRange==MaxRange) {return;}
       resize = (resize || resize===void(0))? true: false; if (!resize || MaxRange===void(0)) {MaxRange = newRange; return;}

       let ratio = newRange / MaxRange;
       R *= ratio;
       G *= ratio;
       B *= ratio;
       MaxRange = newRange;
   }
   this.SetR           = function (newR) {R=ClipValue(newR,MaxRange); return this;}
   this.SetG           = function (newG) {G=ClipValue(newG,MaxRange); return this;}
   this.SetB           = function (newB) {B=ClipValue(newB,MaxRange); return this;}
   this.SetA           = function (newA) {A=ClipValue(newA,1); return this;} //if newA is NaN this will default to 0=transparent
   this.SetColor       = function (X,newG,newB,newA,clip,scaleTo)
   {
      //Note: if clip resieves a boolean it is interpreted as 1 and is the equivalent of 'isPercent'
      if (X instanceof TypeColor) {R=X.GetR(true); G=X.GetG(true); B=X.GetB(true); A=X.GetAlpha(); MaxRange=X.GetMaxRange(); return;}
      
      var temp=X;
      if (IsString(temp) && isNaN(temp)) {temp=temp.match(/[+-]?\d+(\.\d+)?/g);} //In case it is literally a string -->"RGBA(R,G,B,A)" such as coming from a CSS object
      if (IsArray(temp)) {X=temp[0]; newG=temp[1]; newB=temp[2]; newA=temp[3]; clip=temp[4]; scaleTo=temp[5]; } //Distributes the array into the other arguments
      
      if (clip && scaleTo===void(0)) {scaleTo = clip;}
      if (   isNaN(clip) || clip<0   ) {   clip = 255;} //defaults to the standard 255 range
      if (isNaN(scaleTo) || scaleTo<0) {scaleTo = 255;} //defaults to the standard 255 range
      
      MaxRange = clip;
      this.SetR(X);
      this.SetG(newG);
      this.SetB(newB);
      this.SetA((newA===void(0))? 1:newA); //if not given, default to 1=opaque
      this.SetMaxRange(scaleTo,true);
   }
   this.SetEqualTo    = function (otherColor) {this.SetColor (otherColor);}
   this.TransitionTo  = function (otherColor,percent)
   {
      otherColor = (otherColor instanceof TypeColor)? otherColor : new TypeColor(otherColor);
      percent = ClipValue(percent);

      let ratio = otherColor.GetMaxRange / MaxRange;
      return new TypeColor ( R*ratio+(otherColor.GetR(true)-R)*percent, G*ratio+(otherColor.GetG(true)-G)*percent, B*ratio+(otherColor.GetB(true)-B)*percent, A*ratio+(otherColor.GetAlpha()-A)*percent, MaxRange );
   }
   this.IsEqualTo     = function (otherColor)
   {
      otherColor = (otherColor instanceof TypeColor)? otherColor : new TypeColor(otherColor);
      if (R==otherColor.GetR(true) && G==otherColor.GetG(true) && B==otherColor.GetB(true) && A==otherColor.GetAlpha() && MaxRange==otherColor.GetMaxRange()) return true;
      return false;
   }
   this.toString      = function ()  {return this.GetCSScolor();}
   
   //Initialize
   this.SetColor(userX,userG,userB,userA,clipTo,scaleTo);
}
//---------------------------------------------------------------------------------------------------------------------------------------------------

function TypeKinematics(x,y,z) 
{   
    //Note: This object generally serves as a property inside other objects
    //It is suited to handle things that have a center point (center of mass) by which they can translate or rotate

    //PRIVATE Properties -------------------------------
   
    var mass           = 1; //in Kg
    var elasticity     = 1; //from 0-1 for collision energy transfer
    var friction       = 0; //from 0-1
    var datumPos       = new TypeXYZw(x,y,z); //Center of grapvity
    var translationVel = new TypeXYZw();      //Pixels per second
    var rotationVel    = new TypeXYZw();
    var rotationAxis   = new TypeXYZw();
    var tMatrix        = new TypeTmatrix();   //Position rotation and translation transformations to act on datumPos.
    //Note: tMatrix only rotates about the world axis, the datumPos is needed to transfer the rotation to other locales.
      
    //PUBLIC Methods-----------------------------------
    this.UpdatePos = function  ()
    {  //This updates the tMatrix with a delta based on rotation and translation

      var translDelta  = translationVel.ScaleBy(deltaT); //deltaT is a global variable
      var rotDelta     = rotationVel.ScaleBy(deltaT);    //rotDelta = (vel rad/sec) * (dt sec)
      tMatrix.SetTranslate(translDelta.x, translDelta.y, translDelta.z);
    }
    //---------
    this.GetMass           = function ()   {return mass;}
    this.GetElasticity     = function ()   {return elasticity;}
    this.GetFriction       = function ()   {return friction;}
    this.GetDatumPos       = function ()   {return datumPos;}       //client can edit TypeXYZw object once they Get it
    this.GetTranslationVel = function ()   {return translationVel;} //client can edit TypeXYZw object once they Get it
    this.GetRotationVel    = function ()   {return rotationVel;}    //client can edit TypeXYZw object once they Get it
    this.GetTmatrix        = function ()   {return tMatrix;}        //client can edit TypeTmatrix object once they Get it
    this.GetCurrentPos     = function ()   {this.UpdatePos(); return this.GetPos();}
    this.GetPos            = function ()   {return tMatrix.MultiplyWith(datumPos);} //Simply read the position
    this.GetPosAfter       = function (delta)
    {
      var translDelta     = translationVel.ScaleBy(delta);
      //var rotDelta   = ... needs to be implemented
      return tMatrix.Translate(translDelta.x, translDelta.y, translDelta.z).MultiplyWith(datumPos);
    }
    //---------
    this.SetMass           = function (m)      {m = Number(m); if (m<0 || m==NaN) {m=0;} mass=m;} //Cannot be negative
    this.SetElasticity     = function (el)     {elasticity = ClipValue(el);} //Checks range to 0-1
    this.SetFriction       = function (fr)     {friction = ClipValue(fr);}   //Checks range to 0-1
    this.SetDatumPos       = function (x,y,z)  {if (x instanceof TypeXYZw) {datumPos=x;}      else {datumPos.SetEqualTo(x,y,z);} }
    this.SetTranslationVel = function (x,y,z)  {if (x instanceof TypeXYZw) {translationVel=x} else {translationVel.SetEqualTo(x,y,z);} }
    this.SetRotationVel    = function (x,y,z)  {if (x instanceof TypeXYZw) {rotationVel=x}    else {rotationVel.SetEqualTo(x,y,z);}}
    this.SetRotationAxis   = function (x,y,z)  {if (x instanceof TypeXYZw) {rotationAxis=x}   else {rotationAxis.SetEqualTo(x,y,z);}}
    this.SetTmatrix        = function (tm)     {if (tm instanceof TypeTmatrix) {tMatrix=tm}   else {tMatrix.SetEqualTo(tm);} }
    //---------
    this.ApplyTo           = function (point)  {if (point instanceof TypeXYZw) {return tMatrix.MultiplyWith(point);} } //Apply the tMatrix to any point. (ignores local datum)
    this.toString          = function ()
    {
        var result = '[Object TypeKinematics]';
        return result;
    }
}
//---------------------------------------------------------------------------------------------------------------------------------------------------
function TypeXYZw (X,Y,Z,W)
{
   //Note: This is a 3D vector with w serving as a storage and does not contaminate the vector algebra calculations 
   //Note: In some applications w serves as a scalar (the projection matrix of a camera will affect the w value)
   //Note: w defaults to 1.0 to fascilitate vectors serving as vertices sent for rendering (such as openGL)
    
   //PRIVATE properties
   var epsilon = 0.0001; //tolerance for coplanar/colinear tests
   
   //PUBLIC properties
   
   //Note: These properties were left public for the benefit of uncomplicated access
   //Note: On the downside, client functions could assign all kinds of garbage here. Normally these would be strongly typed (like in C++)
   this.x;
   this.y;
   this.z;
   this.w; //The w component is NOT included in any of the calculations
      
   //PUBLIC methods -- the following methods are non destructive (return a new vector or point)
   //Note: dotProduct definition (A*B) -> area of parallelogram -> LenA*LenB*cos(theta)/LenA^2 = LenB*cos(theta)/LenA
   this.DotProduct     = function (v)         {return (v instanceof TypeXYZw)?(v.x*this.x + v.y*this.y + v.z*this.z):NaN;} //Note: The Tmatrix object has it's own internal dot product that includes the w
   this.CrossProduct   = function (v)         {return (v instanceof TypeXYZw)? new TypeXYZw(this.y*v.z - this.z*v.y, this.z*v.x - this.x*v.z, this.x*v.y - this.y*v.x):void(0);}
   this.MutualOrtho    = function (v)         {return this.CrossProduct(v);} //Synonym for cross product. Returns a vector mutualy orthogonal to 'this' and 'v'
   this.Minus          = function (v)         {return (v instanceof TypeXYZw)? new TypeXYZw(this.x-v.x,this.y-v.y,this.z-v.z,1):void(0);} //a - b is a vector from b->a (ba),
   this.Plus           = function (v)         {return (v instanceof TypeXYZw)? new TypeXYZw(this.x+v.x,this.y+v.y,this.z+v.z,1):void(0);}
   this.Length         = function ()          {return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z);}
   this.ScaleBy        = function (scalar)    {return new TypeXYZw (this.x*scalar,this.y*scalar,this.z*scalar);}
   this.ResizeTo       = function (newLength) {var currLen = this.Length(); return (currLen>0)? this.ScaleBy(newLength/currLen) : this;}
   this.AngleXY        = function ()          {return Math.atan2(this.y,this.x);} //angle in radians (atan2 handles correct quadrants)}
   this.AngleYZ        = function ()          {return Math.atan2(this.z,this.y);}
   this.AngleXZ        = function ()          {return Math.atan2(this.z,this.x);}
   this.AngleTO        = function (v)         {return (v instanceof TypeXYZw)? Math.acos(this.DotProduct(v)/(this.Length()*v.Length())):NaN;}
   this.ProjectONTOvec = function (v)         {return (v instanceof TypeXYZw)? v.ScaleBy(v.DotProduct(this)/v.DotProduct(v)):void(0);} //V * (LenThis*cos(theta) / LenV)
   this.ProjectONTOpln = function (a, b, c)   {if (!(a instanceof TypeXYZw && b instanceof TypeXYZw && c instanceof TypeXYZw)) {return;}
                                               var p0     = this.Minus(a);                         //source point relative to 'a'
                                               var normal = b.Minus(a).CrossProduct(c.Minus(a));   //a vector perpendicular to ab and ac
                                               var shadow = p0.ProjectONTOvec(normal);             //the shadow of p0 onto the normal vector
                                               return p0.Minus(shadow).Plus(a);}                   //the other shadow of p0 to the plane shifted by 'a' is the result
   this.ExtendRayToPln = function (r,a,nrm,cl){if (!(r instanceof TypeXYZw && a instanceof TypeXYZw && nrm instanceof TypeXYZw)) {return;}    //'cl' is a boolean for culling
                                               var rayVec = r.Minus(this);                         //assume 'this' is the ray origin which is to be extended along r
                                               var numer  = nrm.DotProduct(a.Minus(this));         //assume 'a' is the origin of the plane. Norm can be un-normalized (it's scale factor cancels out)
                                               var denum  = nrm.DotProduct(rayVec); if (denum==0 || cl==true && denum>0 && numer>0) {return;} //assume 'cl' is for culling. 
                                               var coef   = numer/denum; if(coef<0) {return;}      //Negative coef means plane is behind ray.
                                               return this.Plus(rayVec.ScaleBy(coef));}            //if a hit, returns the hit point
   this.TestRayToRect  = function (r,a,b,c,cl){if (!(a instanceof TypeXYZw && b instanceof TypeXYZw && c instanceof TypeXYZw)) {return;} 
                                               var ab  = b.Minus(a), ac = c.Minus(a).AsOrthoTo(ab), norm = ab.CrossProduct(ac); //assume 'c' is any point on the rectangle's top side
                                               var pln = this.ExtendRayToPln(r,a,norm,cl); if (!pln) {return;} pln = pln.Minus(a); //make pln relative to 'a'
                                               var abU = ab.DotProduct(pln) / ab.DotProduct(ab); 
                                               var acV = ac.DotProduct(pln) / ac.DotProduct(ac);
                                               return (abU>=0 && acV>=0 && abU<=1 && acV<=1)? new TypeXYZw(abU,acV,0) : void(0);} //returns rectangle coordinates of where the ray hit
   this.ExtendRayToLne = function (r,a,b,st)  {var d1   = r.Minus(this);       //Direction vec of line 1 (ray). Skew lines: https://en.wikipedia.org/wiki/Skew_lines
                                               var d2   = b.Minus(a);          //Direction vec of line 2 (segment ab)
                                               var norm = d1.CrossProduct(d2), n1 = d1.CrossProduct(norm);
                                               var t2   = this.Minus(a).DotProduct(n1) / d2.DotProduct(n1); if (st && (t2<0 || t2>1)) {return;} // st is boolean for 'strict' (the closest pt must be strictly in segment ab)
                                               return a.Plus(d2.ScaleBy(t2));} //returns a point along ab that is closest to the ray.
   this.CircumCenter   = function (a,b)       {var v1    = b.Minus(a);
                                               var v2    = this.Minus(a);
                                               var norm  = v1.CrossProduct(v2);
                                               var numer = v2.ScaleBy(v1.DotProduct(v1)).Minus(v1.ScaleBy(v2.DotProduct(v2))).CrossProduct(norm);
                                               var denum = 2*norm.DotProduct(norm); 
                                               return (Math.abs(denum)>epsilon)? a.Plus(numer.ScaleBy(1/denum)):void(0);} //returns the center of a circle containing all three points
   this.AsOrthoTo      = function (v)         {return (v instanceof TypeXYZw)? this.Minus(this.ProjectONTOvec(v)):void(0);}
   this.RotAboutX      = function (angle)     {return new TypeXYZw (this.x, Math.cos(angle)*this.y-Math.sin(angle)*this.z, Math.sin(angle)*this.y+Math.cos(angle)*this.z);}
   this.RotAboutY      = function (angle)     {return new TypeXYZw (Math.cos(angle)*this.z-Math.sin(angle)*this.x, this.y, Math.sin(angle)*this.z+Math.cos(angle)*this.x);}
   this.RotAboutZ      = function (angle)     {return new TypeXYZw (Math.cos(angle)*this.x-Math.sin(angle)*this.y, Math.sin(angle)*this.x+Math.cos(angle)*this.y, this.z);}
   this.RotThruPoint   = function (pt,angle)  {return (pt instanceof TypeXYZw)? this.ScaleBy(Math.cos(angle)).Plus(pt.ScaleBy(Math.sin(angle))):void(0);} //Assume 'this' as U axis and 'pt' as V axis (even if not ortho to U) of an ellipse 
   this.RotAboutAxis   = function (axis,angle){if (!(axis instanceof TypeXYZw)) {return;}
                                               var relOrigin = this.ProjectONTOvec(axis);
                                               var relX = this.Minus(relOrigin); 
                                               var relY = axis.CrossProduct(this).ResizeTo(relX.Length());
                                                   relX = relX.ScaleBy( Math.cos(angle));
                                                   relY = relY.ScaleBy( Math.sin(angle));      
                                               return relX.Plus(relY).Plus(relOrigin);}
   this.IsCoplanar     = function (a, b, c)   {var normal    = b.Minus(a).CrossProduct(c.Minus(a)).ResizeTo(1); //Resizing to 1 is slower, but produces more robust results
                                               var orthoTest = this.Minus(a).ResizeTo(1).DotProduct(normal);    //Resizing this.Minus(a) to 1, in case it is far away, for reliable results
                                               return Math.abs(orthoTest)<epsilon;}                             //Any ortho to the norm is coplanar. Dot product of orthogonal vectors is zero
   this.IsCollinear    = function (a, b)      {return b.Minus(a).IsScalarOf(this.Minus(a));}                    //a and b are points in space defining a line. Check if 'this' point is on that line
   this.IsScalarOf     = function (v)         {return (Math.abs(this.x*v.y-this.y*v.x)<epsilon && Math.abs(this.x*v.z-this.z*v.x)<epsilon && Math.abs(this.y*v.z-this.z*v.y)<epsilon)? true : false;} //vectors are scalars of each other
   this.IsRightOf      = function (a, b)      {var crossP = this.Minus(b).CrossProduct(b.Minus(a)); return ((crossP) > epsilon)? true : (crossP < -epsilon)? false : void(0);} //determine if b->'this' is on the right to a->b
   this.IsOrtho        = function (v)         {return this.DotProduct(v) < epsilon ? true : false;}
   this.IsZero         = function ()          {return (Math.abs(this.x)<epsilon && Math.abs(this.y)<epsilon && Math.abs(this.z)<epsilon)? true : false;} //Does not account for 'w'
   this.IsEqual        = function (v)         {return (v instanceof TypeXYZw)? (Math.abs(this.x-v.x)<epsilon && Math.abs(this.y-v.y)<epsilon && Math.abs(this.z-v.z)<epsilon) : false;}
   this.IsNaN          = function ()          {return isNaN(this.x) || isNaN(this.y) || isNaN(this.z) || isNaN(this.w);}
   this.ReflectAbout   = function (v)         {return this.ProjectONTOvec(v).Plus(this.AsOrthoTo(v).ScaleBy(-1));}
   this.Homogeneous    = function ()          {return this.ScaleBy(1/this.w);}
   this.Get            = function (idx)       {return (idx==0)? this.x : (idx==1)? this.y : (idx==2)? this.z : (idx==3)? this.w : void(0);}
   this.GetCopy        = function (dim)       {return new TypeXYZw(this.x,((dim===void(0) || dim>1)? this.y : 0),((dim===void(0) || dim>2)? this.z : 0),((dim===void(0) || dim>3)? this.w : 1));}
   this.GetAsArray     = function (dim)       {return (dim==2)? [this.x,this.y] : (dim==3)? [this.x,this.y,this.z] : [this.x,this.y,this.z,this.w];}
   this.GetTolerance   = function ()          {return epsilon;}
   this.toString       = function ()          {return '[Object TypeXYZw]->('+this.x+','+this.y+','+this.z+','+this.w+')';}
   
   //This methods are destructive
   this.SetMax         = function (v)    {if (!(v instanceof TypeXYZw)) {return this;} if (v.x>this.x) {this.x = v.x;} if (v.y>this.y) {this.y = v.y;} if (v.z>this.z) {this.z = v.z;} return this;}
   this.SetMin         = function (v)    {if (!(v instanceof TypeXYZw)) {return this;} if (v.x<this.x) {this.x = v.x;} if (v.y<this.y) {this.y = v.y;} if (v.z<this.z) {this.z = v.z;} return this;}
   this.SetX           = function (newX) {this.x = Number(newX); return this;}
   this.SetY           = function (newY) {this.y = Number(newY); return this;}
   this.SetZ           = function (newZ) {this.z = Number(newZ); return this;}
   this.SetW           = function (newW) {this.w = newW; return this;} //w is not as strict since it doesn't participate in vector algebra (other than Homogeneous() )
   this.SetEqualTo     = function (any,y,z,w)         
   {
      if (any instanceof TypeXYZw) {this.x=any.x; this.y=any.y; this.z=any.z; this.w=any.w; return;}
      if (IsArray(any)) { w = any[3]; z = any[2]; y = any[1]; any = any[0]; } //If any of the array indexes are out of range the assignment is void(0)
      
      //Note: NaN is allowed as a value
      this.SetX( (any===void(0))? 0 : any );
      this.SetY( (  y===void(0))? 0 :   y );
      this.SetZ( (  z===void(0))? 0 :   z );
      this.SetW( (  w===void(0))? 1 :   w );
   }
   
   //Initialization
   this.SetEqualTo (X,Y,Z,W);
}
//---------------------------------------------------------------------------------------------------------------------------------------------------
function TypePlane (p1,p2,p3)
{   //Object that represents a plane and can perform planarity tests
    //Private properties
    var a,b,c;         //Three TypeXYZw points to define a plane
    
    //Private methods
    var Initialize = function (p1,p2,p3)
    {
        if (!isNaN(p1)) { a = new TypeXYZw(0,0,p1); b = new TypeXYZw(1,0,p1); c = new TypeXYZw(0,1,p1); return; } //p1 represents zDepth 
        if (p1 instanceof TypePlane) { a = p1.GetA(); b = p1.GetB(); c = p1.GetC(); return; }                      //from another plane

        a = (IsArray(p1))? new TypeXYZw(p1) : (p1 instanceof TypeXYZw)? p1 : void(0);
        b = (IsArray(p2))? new TypeXYZw(p2) : (p2 instanceof TypeXYZw)? p2 : void(0);
        c = (IsArray(p3))? new TypeXYZw(p3) : (p3 instanceof TypeXYZw)? p3 : void(0);
        
        if (b && b.IsEqual(a)) {b = void(0);}
        if (c && b && c.IsEqual(b) || c && a && c.IsEqual(a)) {c = void(0);}
    }
    
    //Public methods
    this.IsProper  = function () {return (a && b && c)? true:false;} //A 'proper' plane has all three points defined
    this.IsStarted = function () {return (a || b || c)? true:false;} //If there is at least on point the plane is considered 'started'
    this.IsEmpty   = function () {return (a===void(0) && b===void(0) && c===void(0))? true:false;}
    this.IsNaN     = function () {return (Number.isNaN(a) || Number.isNaN(b) || Number.isNaN(c))? true:false;}
    this.IsFailed  = function () {return this.IsNaN();}
    
    this.GetA      = function () {return a;}
    this.GetB      = function () {return b;}
    this.GetC      = function () {return c;}
    this.GetZdepth = function () 
    {   //The Z value of the points in the plane in the special case where the plane is parallel to XY (including XY itself)
        //Return void(0) the plane itself is undefined, NaN if not XY parallel, a zDepth if XY parallel
        //Note: Theoretically there could also be a GetYdepth(), or GetXdepth() methods
        
        if (!a && !b && !c) {return void(0);}
        
        //Handle an incomplete plane (a single line, or a single point)
        var pointA = (a)? a : (b) ? b : c;
        var pointB = (b)? b : (c) ? c : a;
        var pointC = (c)? c : (a) ? a : b;
        
        var tolerance = pointA.GetTolerance();
        if (Math.abs(pointA.z-pointB.z)<tolerance && Math.abs(pointA.z-pointC.z)<tolerance) {return pointA.z;} else {return NaN;}
    }
    
    this.Clear     = function () {a = b = c = void(0);}
    this.Set       = function (p1,p2,p3) {Initialize(p1,p2,p3);}

    this.Has       = function (query, isDurable, endCount)
    {   //Check coplanarity with query. 'Has' is interpreted not in an object sense but in a mathematical sense (a plane has an infinite number of points)
        
        //Note: A single point would be coplanar to any other point. A single line (two points) would be coplanar to any other point
        //Note: If the plane is undefined (non of its points are set) then the first three comparisons will pass and those first three points will become the plane
        //Note: 'query' could be a point, a plane, or an array of points
        //Note: 'isDurable' is an optional boolean. If explicitly false, any coplanarity fail will burst the plane to NaN.
        //Note: 'endCount' is an optional value used for checking only a specified number of elements from the end the query array. (Defaults to ALL elements)
        //Note: The reason there is an 'endCount' instead of a startCount, is that elements are often added (pushed) at the end of arrays and those last elements need to be checked

        if (Number.isNaN(a) || Number.isNaN(b) || Number.isNaN(c)) {return;} //coplanarity check has failed permanently on this plane
        
        //Argument gate. Convert 'query' into an array of points.
        var sourceArr  = []; 
        if (query instanceof TypePlane) 
        {
            if (query.IsFailed()) { if (isDurable==false) {a = b = c = NaN;} return;} //Comparison with a failed plane inherits the fail
            if (query.IsEmpty()) {return true;} //Assume an empty plane represents infinite ambiguity and is compatible with all planes
            let otherA = query.GetA(); if(otherA) {sourceArr.push(otherA);} 
            let otherB = query.GetB(); if(otherB) {sourceArr.push(otherB);} 
            let otherC = query.GetC(); if(otherC) {sourceArr.push(otherC);} 
        } 
        else if (IsArray(query)) {sourceArr = query;}
        else if (query instanceof TypeXYZw) {sourceArr.push(query);}
        else {return;}
    
        //Do the comparisons
        var vertCount  = sourceArr.length;
        var startIdx   = (!endCount || vertCount-endCount<=0)? 0:vertCount-endCount;
        for (let i=startIdx; i<vertCount; i++)
        {   //Walk through each point in the the sourceArr and check for coplanarity
            
            let sourcePoint = sourceArr[i]; if (!(sourcePoint instanceof TypeXYZw)) {return;} //The array is not homogeneous
            
            //Start forming the comparison plane if not already present (must be a valid plane)
            if (!a) {a = sourcePoint; continue;}
            if (!b) {b = (a.IsEqual(sourcePoint))? void(0) : sourcePoint; continue;}
            if (!c) {c = (a.IsEqual(sourcePoint) || b.IsEqual(sourcePoint))? void(0) : sourcePoint; continue;}
    
            //Coplanarity check
            if(!sourcePoint.IsCoplanar(a,b,c)) {if(isDurable==false) {a = b = c = NaN;} return;}
        }
        return true;
    }
    this.toString = function ()
    {
        var result  = '[Object TypePlane]\n';
            result += '   Point a:'+a+'\n';
            result += '   Point b:'+b+'\n';
            result += '   Point c:'+c;
        return result;
    }
    
    //Initialization
    Initialize(p1,p2,p3);
}
//---------------------------------------------------------------------------------------------------------------------------------------------------
function TypeTmatrix (incomingData) 
{  
   //Properties
   this.data = [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]; //Follow math convention of [row][column]
   
   //PRIVATE methods
   
   var IsProperMatrixArray = function (dataArr)
   {   //Check if it is a 4x4 array
       if (!IsArray(dataArr) || dataArr.length!=4) {return false;}
       for (let i=0;i<4;i++) {if (!IsArray(dataArr[i]) || dataArr[i].length!=4) {return false;} }
       //Checks passed
       return true;
   }
   
   //PUBLIC Methods

   //The following methods are not destructive (they return a new object)
   this.MultiplyWith = function (B)
   {  //Non destructive multiplication

      if (B == void(0)) {return;}
      if (B instanceof TypeTmatrix)
      {  //Matrix multiplication according to the 'Computer Systems book', probably unnecessary for such a small matrix
         var c = new TypeTmatrix(); c.SetZero();
         for (let i=0;i<4;i++) for (let k=0;k<4;k++) {let r=this.data[i][k]; for (let j=0;j<4;j++) c.data[i][j] += r * B.data[k][j];}

         return c;
      }
      if (B instanceof TypeXYZw) {B=B.GetAsArray();}
      if (IsArray(B))
      {  //Multiply with a vector
         var temp=[0,0,0,0];
         for (let i=0;i<4;i++) for (let j=0;j<4;j++) temp[i] += this.data[i][j] * B[j];
         
         return new TypeXYZw(temp[0],temp[1],temp[2],temp[3]); //Note: if any component of B is NaN the entire result will be NaN
      }
      if (!isNaN(B))
      {   //Multiply with a scalar
          var c = new TypeTmatrix();
          for (let i=0;i<16;i++) {let row=~~(i/4), col=i%4; c.data[row][col] = this.data[row][col] * B; }
          
          return c;
      }
      Say('WARNING: (MultiplyWith) Did not receive a TypeTmatrix, or a TypeXYZw vector, or a scalar to multiply',-1); 
      return;
   }
   this.RotateAboutX = function (angle)
   {  //Non destructive roation transformation
      angle = isNaN(angle) ? 0 : Number(angle);
      var rotationMatrix = new TypeTmatrix();
      rotationMatrix.data[1][1]= Math.cos(angle);
      rotationMatrix.data[1][2]=-Math.sin(angle);
      rotationMatrix.data[2][1]= Math.sin(angle);
      rotationMatrix.data[2][2]= Math.cos(angle);
      return rotationMatrix.MultiplyWith(this);
   } 
   this.RotateAboutY = function (angle)
   {  //Non destructive roation transformation
      //left handed coordinate system -- from +Y looking to the origin
      angle = isNaN(angle) ? 0 : Number(angle);
      var rotationMatrix = new TypeTmatrix();
      rotationMatrix.data[0][0]= Math.cos(angle);
      rotationMatrix.data[0][2]= Math.sin(angle);
      rotationMatrix.data[2][0]=-Math.sin(angle);
      rotationMatrix.data[2][2]= Math.cos(angle);
      return rotationMatrix.MultiplyWith(this);
   }
   this.RotateAboutZ = function (angle)
   {  //Non destructive roation transformation
      angle = isNaN(angle) ? 0 : Number(angle);
      var rotationMatrix = new TypeTmatrix();
      rotationMatrix.data[0][0]= Math.cos(angle);
      rotationMatrix.data[0][1]=-Math.sin(angle);
      rotationMatrix.data[1][0]= Math.sin(angle);
      rotationMatrix.data[1][1]= Math.cos(angle);
      return rotationMatrix.MultiplyWith(this);
   }
   this.Rotate2D    = function (angle) {this.RotateAboutZ (angle);}
   this.Translate   = function (dX,dY,dZ)
   {  //Non destructive translation transformation
      dX = isNaN(dX) ? 0 : Number(dX);
      dY = isNaN(dY) ? 0 : Number(dY);
      dZ = isNaN(dZ) ? 0 : Number(dZ);
      
      var TranslationMatrix = new TypeTmatrix(this);
      TranslationMatrix.data[0][3]+=dX;
      TranslationMatrix.data[1][3]+=dY;
      TranslationMatrix.data[2][3]+=dZ;

      return TranslationMatrix;
   }
   this.GetRow       = function (rowIdx) {rowIdx = ClipValue(rowIdx,3); return new TypeXYZw(this.data[rowIdx][0],this.data[rowIdx][1],this.data[rowIdx][2],this.data[rowIdx][3]);}
   this.GetColumn    = function (colIdx) {colIdx = ClipValue(colIdx,3); return new TypeXYZw(this.data[0][colIdx],this.data[1][colIdx],this.data[2][colIdx],this.data[3][colIdx]);}
   this.GetCopy      = function ()       {return new TypeTmatrix(this);}
   this.Inverse      = function ()
   {   //Non destructive
       //Using the Laplace expansion theorem
       //c and s are arrays that hold determinants of varius 2x2 submatrices of this.data

       var a = this.data;
   
       var c = [];
       c[0] = a[2][0]*a[3][1] - a[2][1]*a[3][0];
       c[1] = a[2][0]*a[3][2] - a[2][2]*a[3][0];
       c[2] = a[2][0]*a[3][3] - a[2][3]*a[3][0];
       c[3] = a[2][1]*a[3][2] - a[2][2]*a[3][1];
       c[4] = a[2][1]*a[3][3] - a[2][3]*a[3][1];
       c[5] = a[2][2]*a[3][3] - a[2][3]*a[3][2];
       
       var s = [];
       s[0] = a[0][0]*a[1][1] - a[0][1]*a[1][0];
       s[1] = a[0][0]*a[1][2] - a[0][2]*a[1][0];
       s[2] = a[0][0]*a[1][3] - a[0][3]*a[1][0];
       s[3] = a[0][1]*a[1][2] - a[0][2]*a[1][1];
       s[4] = a[0][1]*a[1][3] - a[0][3]*a[1][1];
       s[5] = a[0][2]*a[1][3] - a[0][3]*a[1][2];

       var detA = s[0]*c[5] - s[1]*c[4] + s[2]*c[3] + s[3]*c[2] - s[4]*c[1] + s[5]*c[0]; if (detA==0) {return void(0);}
       
       var adjugate = new TypeTmatrix();
       adjugate.data[0] = [ a[1][1]*c[5] - a[1][2]*c[4] + a[1][3]*c[3], -a[0][1]*c[5] + a[0][2]*c[4] - a[0][3]*c[3], a[3][1]*s[5] - a[3][2]*s[4] + a[3][3]*s[3], -a[2][1]*s[5] + a[2][2]*s[4] -a[2][3]*s[3] ];
       adjugate.data[1] = [-a[1][0]*c[5] + a[1][2]*c[2] - a[1][3]*c[1], +a[0][0]*c[5] - a[0][2]*c[2] + a[0][3]*c[1],-a[3][0]*s[5] + a[3][2]*s[2] - a[3][3]*s[1], +a[2][0]*s[5] - a[2][2]*s[2] +a[2][3]*s[1] ];
       adjugate.data[2] = [ a[1][0]*c[4] - a[1][1]*c[2] + a[1][3]*c[0], -a[0][0]*c[4] + a[0][1]*c[2] - a[0][3]*c[0], a[3][0]*s[4] - a[3][1]*s[2] + a[3][3]*s[0], -a[2][0]*s[4] + a[2][1]*s[2] -a[2][3]*s[0] ];
       adjugate.data[3] = [-a[1][0]*c[3] + a[1][1]*c[1] - a[1][2]*c[0], +a[0][0]*c[3] - a[0][1]*c[1] + a[0][2]*c[0],-a[3][0]*s[3] + a[3][1]*s[1] - a[3][2]*s[0], +a[2][0]*s[3] - a[2][1]*s[1] +a[2][2]*s[0] ];

       return adjugate.MultiplyWith(1/detA);
   }
   this.Transpose    = function ()
   {  //Non destructive
      var result = new TypeTmatrix(); 
      
      for (let i=0;i<4;i++) for(let j=i;j<4;j++) 
      { 
        result.data[j][i]=this.data[i][j]; 
        if (i!=j) {result.data[i][j]=this.data[j][i];} 
      }
     
      //Alternative method (same speed)
      //Note: In javascript ~~ removes the fractional part of a number (double NOT bitwise operator)
      //for (let i=0; i<16; i++) { result.data[i%4][~~(i/4)] = this.data[~~(i/4)][i%4]; }  
  
      return result;
   }
   
   //Set methods are always destructive (they affect the this object's values and old values are lost)
   this.SetIdentity     = function ()         {this.data = [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]; return this;}
   this.SetZero         = function ()         {this.data = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]]; return this;}
   this.SetRotateAboutX = function (angle)    {this.SetEqualTo(this.RotateAboutX(angle)); return this;}
   this.SetRotateAboutY = function (angle)    {this.SetEqualTo(this.RotateAboutY(angle)); return this;}
   this.SetRotateAboutZ = function (angle)    {this.SetEqualTo(this.RotateAboutZ(angle)); return this;}
   this.SetRotate2D     = function (angle)    {this.SetEqualTo(this.RotateAboutZ(angle)); return this;}
   this.SetTranslate    = function (dX,dY,dZ) {this.SetEqualTo(this.Translate(dX,dY,dZ)); return this;}
   this.SetSwapRows     = function (rowA, rowB) 
   {
       rowA = Number(rowA);
       rowB = Number(rowB);
       if (rowA==NaN || rowB==NaN || rowA<0 || rowB<0 || rowA>3 || rowB>3) {return;}
       
       var tempRow = this.data[rowB]; 
       this.data[rowB]=this.data[rowA]; 
       this.data[rowA]=tempRow;
   }
   this.SetEqualTo      = function (other)    
   {
       var otherData;
       if (other===void(0)) {return;} else if (other instanceof TypeTmatrix) {otherData = other.data;} else if (IsProperMatrixArray(other)) {otherData = other;} else {Say('WARNING (SetEqualTo) Did not a receive an array or a matrix object',-1); return;}
       
       //Copy the matrix
       for (let i=0;i<4;i++) for(let j=0;j<4;j++) {this.data[i][j]=otherData[i][j];}
   }
   this.SetRow          = function (rowIdx, rowData) 
   {
       rowIdx=ClipValue(rowIdx,3); 
       if(!(rowData instanceof TypeXYZw)){rowData = new TypeXYZw(rowData);} 

       this.data[rowIdx][0]=rowData.x; this.data[rowIdx][1]=rowData.y; this.data[rowIdx][2]=rowData.z; this.data[rowIdx][3]=rowData.w;
   }
   this.SetColumn       = function (colIdx, colData) 
   {
       colIdx=ClipValue(colIdx,3); 
       if(!(colData instanceof TypeXYZw)){colData = new TypeXYZw(colData);} 

       this.data[0][colIdx]=colData.x; this.data[1][colIdx]=colData.y; this.data[2][colIdx]=colData.z; this.data[3][colIdx]=colData.w;
   }
   this.toString = function ()
   {
       var result='[Object TypeTmatrix] \n';
       for (let i=0;i<16;i++) { if (i%4 == 0) {result+= '['; } result += this.data[~~(i/4)][i%4].toFixed(3); result += (i%4 == 3)? ']\n' : ','; }
       return result;
   }
   
   //Initialization
   this.SetEqualTo (incomingData);
}
//---------------------------------------------------------------------------------------------------------------------------------------------------
function TypeCamera2D(canvCtx,posX,posY,maxX,maxY,minX,minY) 
{  //Camera Position defined as the upper left corner of its view
   //max is defined as how far the upper left corner can travel

   //Private properties
   var canvasCtx  = canvCtx;
   var viewWidth  = canvasCtx.canvas.clientWidth;
   var viewHeight = canvasCtx.canvas.clientHeight;
   var diagonal   = Math.sqrt(viewWidth*viewWidth+viewHeight*viewHeight);
   var diag35mm   = Math.sqrt(36*36+24*24);
   var fov        = 46.792*degToRad;
   var kinematics = new TypeKinematics(posX,posY);
   var maxLimit   = new TypeXYZw(maxX,maxY);
   var minLimit   = new TypeXYZw(minX,minY);

   //Public methods
   this.GetFocalLength = function ()               {return diag35mm/(2*Math.tan(fov/2));}
   this.SetFocalLength = function (newFocalLength) {fov=2*Math.atan(diag35mm/(2*newFocalLength));} //focal length in 35mm terms
   this.GetFOV         = function ()               {return fov;}
   this.GetPosUpLeft   = function ()               
   {
      var curPos = kinematics.GetPos();
 
      if      (curPos.x<minLimit.x) {kinematics.GetTranslationVel().x=0; kinematics.GetTmatrix().data[0][3]=minLimit.x-kinematics.GetDatumPos().x;}
      else if (curPos.x>maxLimit.x) {kinematics.GetTranslationVel().x=0; kinematics.GetTmatrix().data[0][3]=maxLimit.x-kinematics.GetDatumPos().x;}
      if      (curPos.y<minLimit.y) {kinematics.GetTranslationVel().y=0; kinematics.GetTmatrix().data[1][3]=minLimit.y-kinematics.GetDatumPos().y;}
      else if (curPos.y>maxLimit.y) {kinematics.GetTranslationVel().y=0; kinematics.GetTmatrix().data[1][3]=maxLimit.y-kinematics.GetDatumPos().y;}

      return curPos;
   }
   this.GetPosCenter   = function ()               {var curPos = this.GetPosUpLeft(); curPos.x +=viewWidth/2; curPos.y +=viewHeight/2; return curPos;}
   this.Update         = function ()               {kinematics.UpdatePos();}
   this.GetCanvasCtx   = function ()               {return canvasCtx;}
   this.TranslateBy    = function (dx,dy)          {kinematics.GetTmatrix().SetTranslate(dx,dy,0);} //This should rarely be used. Velocity is the proper methods to move
   this.GetViewWidth   = function ()               {return viewWidth;}
   this.GetViewHeight  = function ()               {return viewHeight;}
   this.GetDepthScale  = function (atZdepth)
   {  //returns a scalar: How much smaller an object would look at that depth
      var eyeDist = diagonal/(2*Math.tan(fov/2));
      var newDiag = (1+atZdepth/eyeDist)*diagonal;
      return diagonal/newDiag;
   }
   this.SetTranslVel   = function (v)              {kinematics.SetTranslationVel(v);}
   this.toString       = function ()               {return '[Object TypeCamera2D]';}
}
//---------------------------------------------------------------------------------------------------------------------------------------------------
function TypeCamera()
{  //Full featured camera for 3D graphics (code ported from my OpenGL project in C++)

    //PRIVATE properties------------------------------------
    const diag35mm = Math.sqrt(36*36+24*24);
    
    //Note: with the camera object the eye and target points are adjusted directly and a viewMatrix is generated; instead of the other way around
    var eyePos   = new TypeXYZw(0,0,12.5);   //this is manipulated directly and a view matrix is then calculated out of it
    var target   = new TypeXYZw(0,0,0);      //this can also be manipulaed directly
    var up       = new TypeXYZw(0,1,0);
    var fov      = new TypeXYZw();           //in radiants. Fields of view in x,y,diag directions
    
    var standardViews = {
        topView    :{eye:new TypeXYZw( 0.0,  0.0,12.5), target:new TypeXYZw(), up:new TypeXYZw(0,1,0)},
        frontView  :{eye:new TypeXYZw( 0.0,-12.5, 0.0), target:new TypeXYZw(), up:new TypeXYZw(0,0,1)},
        rightView  :{eye:new TypeXYZw(12.5,  0.0, 0.0), target:new TypeXYZw(), up:new TypeXYZw(0,0,1)},
        perspective:{eye:new TypeXYZw(-1.9619,-4.11307,2.05759), target:new TypeXYZw(), up:new TypeXYZw(0,1,0)}
    }

    var isOrtho  = false;                    //default to 3d projection
    var plane    = {nearDist:4, farDist:30, clipLeft:-1, clipRight:1, clipTop:1, clipBottom:-1, aspect:1}; 
    //Note: Imagine a field of view cone projecting in front of the lens (eyePos). 
    //Note: There is nearPlane bounded by clipLeft, clipRight, clipTop, and clipBottom dimensions

    var viewMatrix       = new TypeTmatrix(); //camera vantage point
    var projectionMatrix = new TypeTmatrix(); //perspective distortion (a 2x2x2 cuboid)
    var viewportMatrix   = new TypeTmatrix(); //window coordinates from the nearplane cuboid

    //PUBLIC properties-------------------------------------
    this.name;

    //PRIVATE Methods---------------------------------------
    var Initialize              = function ()
    {
        ComputeFOV();
        ComputeAspect();
        ComputeViewMatrix();
        ComputeProjectionMatrix();
    }
    var ComputeProjectionMatrix = function ()
    {   //Projection matrix is what causes perspective (things in the distance to look smaller)
        //When multiplied with a vector, it affects the w value (which serves as a scalar divider for the XYZ values)
        //This way the true world coordinates of a vertex are not affected, but can be uniformly scaled to fascilitate the appearance of perspective distortion 
        
        projectionMatrix.SetZero();

        if (isOrtho==false)
        { //Perspective projection.
            projectionMatrix.data[0][0] =                    2.0 * plane.nearDist / (plane.clipRight - plane.clipLeft);
            projectionMatrix.data[0][2] =      (plane.clipRight + plane.clipLeft) / (plane.clipRight - plane.clipLeft);
            projectionMatrix.data[1][1] =                    2.0 * plane.nearDist / (plane.clipTop - plane.clipBottom);
            projectionMatrix.data[1][2] =      (plane.clipTop + plane.clipBottom) / (plane.clipTop - plane.clipBottom);
            projectionMatrix.data[2][2] =       -(plane.farDist + plane.nearDist) / (plane.farDist - plane.nearDist);
            projectionMatrix.data[2][3] = -(2.0 * plane.farDist * plane.nearDist) / (plane.farDist - plane.nearDist);
            projectionMatrix.data[3][2] = -1;
        }
        else
        { //Parallel projection
            projectionMatrix.data[0][0] =                                 2.0 / (plane.clipRight - plane.clipLeft);
            projectionMatrix.data[0][3] = -(plane.clipRight + plane.clipLeft) / (plane.clipRight - plane.clipLeft);
            projectionMatrix.data[1][1] =                                 2.0 / (plane.clipTop - plane.clipBottom);
            projectionMatrix.data[1][3] = -(plane.clipTop + plane.clipBottom) / (plane.clipTop - plane.clipBottom);
            projectionMatrix.data[2][2] =                                -2.0 / (plane.farDist - plane.nearDist);
            projectionMatrix.data[2][3] =   -(plane.farDist + plane.nearDist) / (plane.farDist - plane.nearDist);
            projectionMatrix.data[3][3] = 1;
        }
    }
    var ComputeViewMatrix = function ()
    {   //View matrix is the current vantage point from the eyePos to Target. It is an eye trick. 
        //It is essentially a matrix that affects the entire scene making it look like the camera is moving
        
        var camZ = target.Minus(eyePos).ResizeTo(1); //vector eyeTarget
        var camY = up;                               //vector camera up
        var camX = camZ.CrossProduct(camY);          //vector camera X (orthogonal to eyeTarget and Up)

        viewMatrix.SetIdentity();  
        viewMatrix.data[0]=[ camX.x, camX.y, camX.z, -eyePos.DotProduct(camX)];
        viewMatrix.data[1]=[ camY.x, camY.y, camY.z, -eyePos.DotProduct(camY)];
        viewMatrix.data[2]=[-camZ.x,-camZ.y,-camZ.z,  eyePos.DotProduct(camZ)];
    }
    var ComputeViewportMatrix = function (w,h,maxZ,minX,minY,minZ)
    {   //ViewportMatrix is a transformation from a near-plane projection matrix cuboid into window coordinates
        //Note: viewport is the section of the canvas that will display the scene (usually the whole canvas-> minX=0,minY=0)
        //Note: regardless of the near plane's clip values the projection matrix generates values on a 2x2x1 cube (cuboid)
        //Note: the projection matrix cuboid is then flipped on the Y axis and stretched to fit the window pixel dimensions
        //Note: To get screen coordinates, multiply VieportMatrix*PVMmatrix*vertex and convert the result to homogeneous coordinates (divide by w)
        viewportMatrix.data[0] = [w/2,    0,         0, minX+w/2];
        viewportMatrix.data[1] = [  0, -h/2,         0, minY+h/2];
        viewportMatrix.data[2] = [  0,    0, maxZ-minZ,     minZ];
        viewportMatrix.data[3] = [  0,    0,         0,        1];
    }
    var ComputeFOV = function ()
    {
        fov.x = Math.atan(Math.abs(plane.clipLeft)/plane.nearDist) + Math.atan(Math.abs(plane.clipRight)/plane.nearDist);
        fov.y = Math.atan(Math.abs(plane.clipTop)/plane.nearDist) + Math.atan(Math.abs(plane.clipBottom)/plane.nearDist);
        
        //This is the diagonal FOV, but saved in the 'z' variable of the TypeXYZw object
        var diagA = Math.sqrt(plane.clipLeft * plane.clipLeft + plane.clipTop * plane.clipTop);
        var diagB = Math.sqrt(plane.clipRight * plane.clipRight + plane.clipBottom * plane.clipBottom);
        fov.z = Math.atan(diagA/plane.nearDist) + Math.atan(diagB/plane.nearDist); 
    }
    var ComputeClipPlaneScale = function (th1, th2, newFOV)
    {   //given a new FOV, how much would you have to scale the clip plane dimensions

        //angles in rad
        //th1 is the angle from 0 to clipBottom
        //th2 is the angle from 0 to clipTop
        //th1+th2 = current FOV
        //newFOV is a different angle which will define a larger clip plane
        //This function returns the scalar needed to multiply the current clip plane in order for it to span the newFOV angle
        let a=Math.tan(th1)*Math.tan(th2)*Math.tan(newFOV);
        let b=Math.tan(th1)+Math.tan(th2);
        let c=-Math.tan(newFOV);

        //Solving a quadratic
        let L1=(-b+Math.sqrt(b*b-4*a*c))/(2*a);
        let L2=(-b-Math.sqrt(b*b-4*a*c))/(2*a);

        //Discard the negative value
        return (L1>0)? L1 : L2;
    }
    var ComputeAspect = function () {plane.aspect = (plane.clipRight - plane.clipLeft) / (plane.clipTop - plane.clipBottom);} //Simply interprets the existing clip dimensions
    var SetAspect     = function (newRatio) 
    {   //this method establishes a new aspect ratio and it will adjust clipping values and FOV

        //assume ratio is width/height
        newRatio = Math.abs(Number(newRatio)); if (!newRatio) {return;}
        
        //Set the aspect parameter
        plane.aspect=newRatio;
        
        //Adjust the clip dimensions
        if (newRatio<1) 
        {   //Which means height>width
            plane.clipTop    = plane.clipRight * 1.0/newRatio;
            plane.clipBottom = plane.clipLeft  * 1.0/newRatio;
        }
        else
        {
            plane.clipRight = plane.clipTop    * newRatio;
            plane.clipLeft  = plane.clipBottom * newRatio;
        }
        //Reasoning behind all this -->
        // cH/cW = wH/wW -> cH=cW * wH/wW (1)
        // cH=cT-cB, cW=cR-cL, then substitute into (1)
        // cT-cB=(cR-cL) * wH/wW -> cT - cB = cR*wH/wW - cL*wH/wW (2)
        // let cT = cR*wH/wW (3)
        // let cB = cL*wH/wW (4)
        // EQUATIONS (3)-(4) = (2)
        // We do it this way because the clipping plane might not have been centered to begin with
    
        //Now adjust the FOV
        ComputeFOV(); 
        ComputeProjectionMatrix();
    }

    //PUBLIC Methods---------------------------------------
    this.SetNearPlaneDist = function (newDist)
    { 
        newDist = Number(newDist); if (!newDist) {return;}
        
        if (newDist >= plane.farDist) {plane.farDist+=1;}
        plane.nearDist = newDist; 
        
        this.ComputeFOV(); 
        this.ComputeProjectionMatrix();
        return this;
    }
    this.SetFarPlaneDist = function (newDist)
    {
        newDist = Number(newDist); if (!newDist) {return;}
        if (newDist <= plane.nearDist) {newDist = plane.nearDist+1;}
        plane.farDist = newDist;
        return this;
    }
    this.SetFOVdiag  = function (radAngle)
    {   //Change field of view while keeping the same near plane dimensions (changing the eye posisition)
    
        radAngle   = Number(radAngle); if (!radAngle) {return;}
        
        var diagA  = Math.sqrt(plane.clipLeft  * plane.clipLeft  + plane.clipTop    * plane.clipTop   );
        var diagB  = Math.sqrt(plane.clipRight * plane.clipRight + plane.clipBottom * plane.clipBottom);
        var angleB = (radAngle - Math.asin((diagA-diagB)*Math.sin(radAngle)/(diagA+diagB)))/2;
        
        plane.nearDist = diagB/Math.tan(angleB);
        
        fov.z  = radAngle;
        fov.x  = Math.atan(Math.abs(plane.clipLeft) / plane.nearDist) + Math.atan(Math.abs(plane.clipRight ) / plane.nearDist);
        fov.y  = Math.atan(Math.abs(plane.clipTop ) / plane.nearDist) + Math.atan(Math.abs(plane.clipBottom) / plane.nearDist); 
        eyePos = eyePos.Minus(target).ResizeTo(2*plane.nearDist).Plus(target);
        
        plane.farDist  = 3 * plane.nearDist;

        ComputeViewMatrix();
        ComputeProjectionMatrix();
        return this;
    }
    this.SetFOVy = function (radAngle)
    {   //Change field of view on the Y axis of the camera by scaling the near plane (keeping the eye position)
        //will affect clip plane values (size of near plane)
        radAngle = Number(radAngle); if (!radAngle) {return;}

        let th1    = Math.atan(Math.abs(plane.clipBottom) / plane.nearDist); //first component angle of the FOVy angle in rads
        let th2    = Math.atan(Math.abs( plane.clipTop  ) / plane.nearDist); //second component angle of the FOVy angle in rads
        let scalar = ComputeClipPlaneScale(th1,th2,radAngle);

        //Adjust the clip plane size
        plane.clipBottom *= scalar;
        plane.clipTop    *= scalar;
        plane.clipLeft   *= scalar;
        plane.clipRight  *= scalar;

        //Given the new clip plane size we can compute the FOV
        ComputeFOV(); 
        ComputeProjectionMatrix();
        return this;
    }
    this.Move = function (newTarget, isDelta)
    {
        let delta = newTarget; if (!isDelta) {delta.SetEqualTo(newTarget.Minus(GetTarget()) );}

        eyePos.SetEqualTo(eyePos.Plus(delta));
        target.SetEqualTo(target.Plus(delta));

        ComputeViewMatrix ();
        return this;
    }
    this.Zoom = function (deltaRadAngle)
    {   //Changes the focal length of the camera
        //The distance to the near plane remains the same but the ->size<- of the near plane changes
        //When that happens the field of view changes and so the 36x24mm image sensor behind the lens will have to move in order to fit in the new fov
        //Larger FOV means the sensor has to move closer (reducing the focal length) and vice-versa
        let newFOVy = fov.y - deltaRadAngle;
        if (newFOVy > (120*degToRad) || newFOVy < (5*degToRad)) return;

        this.SetFOVy(newFOVy); //This will also update the projection matrix
        return this;
    }
    this.RotateX = function (radAngle)
    {   //Use Target as pivot to rotate camera about an X-axis passing through the target point but is oriented relative to camera

        let tempEye = eyePos.Minus(target);    //tempEye no looks at world 0,0,0
        let camX    = tempEye.MutualOrtho(up); //orthogonal to position and the Up vector is the camera x-axis
    
        tempEye.SetEqualTo(tempEye.RotAboutAxis(camX,radAngle));
        eyePos.SetEqualTo(tempEye.Plus(target));
        up.SetEqualTo(up.RotAboutAxis(camX,radAngle));

        ComputeViewMatrix();
        return this;
    }
    this.RotateZ = function (radAngle)
    {   //Use Target as pivot to rotate camera about the Z-axis passing through the target point
      
        let tempEye = eyePos.Minus(target); //tempEye no looks at world 0,0,0
        tempEye.SetEqualTo(tempEye.RotAboutZ(radAngle));
        eyePos.SetEqualTo(tempEye.Plus(target));
        up.SetEqualTo(up.RotAboutZ(radAngle));

        ComputeViewMatrix();
        return this;
    }
    this.SetViewport = function (width,height,maxZ,minX,minY,minZ) 
    {   //This method sets the aspect ratio and establishes a viewportMatrix
        width  = Number(width);  if (!width)  {Say('WARNING: (SetViewport) Received invalid width dimension',-1); return;}
        height = Number(height); if (!height) {Say('WARNING: (SetViewport) Received invalid height dimension',-1); return;}
        maxZ   = (maxZ===void(0))? 1 : Number(maxZ);
        minX   = (minX===void(0))? 0 : Number(minX);
        minY   = (minY===void(0))? 0 : Number(minY);
        minZ   = (minZ===void(0))? 0 : Number(minZ);

        SetAspect((width-minX)/(height-minY)); 
        ComputeViewportMatrix(width,height,maxZ,minX,minY,minZ); 
        return this;
    }
    this.IsTopView              = function () {let a = eyePos.Minus(target);let b = standardViews.topView.eye.Minus(standardViews.topView.target); return a.IsScalarOf(b); return eyePos.Minus(target).IsScalarOf(standardViews.topView.eye.Minus(standardViews.topView.target));}
    this.SetOrthoMode           = function (state)     {isOrtho = (state)? true : false; ComputeProjectionMatrix(); return this;}
    this.SetFocalLength35       = function (newLength) {this.SetFOVdiag(Math.atan(diag35mm/(2*newLength))*2); return this;}
    this.SetViewTop             = function () {eyePos.SetEqualTo(standardViews.topView.eye); target.SetEqualTo(standardViews.topView.target); up.SetEqualTo(standardViews.topView.up); ComputeViewMatrix(); return this;}
    this.SetViewFront           = function () {eyePos.SetEqualTo(standardViews.frontView.eye); target.SetEqualTo(standardViews.frontView.target); up.SetEqualTo(standardViews.frontView.up); ComputeViewMatrix(); return this;}
    this.SetViewRight           = function () {eyePos.SetEqualTo(standardViews.rightView.eye); target.SetEqualTo(standardViews.rightView.target); up.SetEqualTo(standardViews.rightView.up); ComputeViewMatrix(); return this;}
    this.SetViewPerspective     = function () {eyePos.SetEqualTo(standardViews.perspective.eye); target.SetEqualTo(standardViews.perspective.target); up.SetEqualTo(standardViews.perspective.up); ComputeViewMatrix(); return this;}

    this.UpdateViewMatrix       = function () {ComputeViewMatrix();}
    this.UpdateProjectionMatrix = function () {ComputeProjectionMatrix();}

    //---------
    //Note: There is a slight difference between GetFocalLength and GetFocalLength35
    //Note: If we project a FOV cone behind the eyePos and we slide a 36mmX24mm plane until it fits snuggly we get the 35mm equivalent focal length
    this.GetViewportMatrix      = function () {return viewportMatrix;}
    this.GetCameraPlane         = function () {return plane;}
    this.GetNearPlaneWidth      = function () {return Math.abs(plane.clipLeft) + Math.abs(plane.clipRight);}
    this.GetNearPlaneHeight     = function () {return Math.abs(plane.clipTop ) + Math.abs(plane.clipBottom);}
    this.GetFocalLength         = function () {return plane.nearDist;}
    this.GetFarPlaneDist        = function () {return plane.farDist;}
    this.GetFocalLength35       = function () {return diag35mm/(2*Math.tan(fov.z/2));}
    this.GetEyePos              = function () {return eyePos;}
    this.GetTargetPos           = function () {return target;}
    this.GetAspect              = function () {return plane.aspect;}
    this.GetUpDirection         = function () {return up;}
    this.GetIsOrtho             = function () {return isOrtho;}
    this.GetViewMatrix          = function () {return viewMatrix;}
    this.GetProjectionMatrix    = function () {return projectionMatrix;}
    this.GetImageCoordForPoint  = function (point3D,imageWidth,imageHeight)
    {   //Compute where on the image will a point from the scene project to. (0,0 is upper left)
    
        imageWidth  = Number(imageWidth );
        imageHeight = Number(imageHeight);
        if (!(point3d instanceof TypeXYZw) || !imageWidth || !imageHeight) {return;}
        
        var normPoint = projectionMatrix.MultiplyWith(viewMatrix).MultiplyWith(point3D);
        normPoint = normPoint.ScaleBy(1/normPoint.w);
        
        return new TypeXYZw ((normPoint.x+1)*imageWidth/2,(1-normPoint.y)*imageHeight/2)
    }
    this.toString = function ()
    {
        var result = '[Object TypeCamera] \n';
        result    += 'Camera name   = '+this.name+'\n';
        result    += 'Eye position  = '+eyePos+'\n';
        result    += 'Camera target = '+target+'\n';
        result    += 'Camera UpVec  = '+up+'\n';
        result    += 'FieldOfView   = '+fov+'\n';
        result    += 'Camera plane  = '+plane+'\n';
        result    += '       near distance: '+plane.nearDist+'\n';
        result    += '       far  distance: '+plane.farDist+'\n';
        result    += '       clipLeft     : '+plane.clipLeft+'\n';
        result    += '       clipRight    : '+plane.clipRight+'\n';
        result    += '       clipTop      : '+plane.clipTop+'\n';
        result    += '       clipBottom   : '+plane.clipBottom+'\n';
        result    += '       aspect       : '+plane.aspect+'\n';
        result    += 'isOrtho       = '+isOrtho+'\n';
        result    += 'View matrix   = '+viewMatrix+'\n';
        result    += 'ProjectionMatrix = '+projectionMatrix+'\n';
        return result;
    }

    //Initialization
    Initialize();
}
//------------------------------------------------------------------------------------------
function TypeBoundingBox ()
{   //A world aligned bounding box

    //Privte properties
    var min; //A TypeXYZw point
    var max; //A TypeXYZw point
    
    //Public methods
    this.GetMin = function () {return min;}
    this.GetMax = function () {return max;}
    this.Reset  = function () {min = max = void(0);}
    this.Update = function (newPoint)
    {
        //Note: Can receive another boundingBox object
        
        let auxPoint;
        
        if (  newPoint instanceof TypeBoundingBox) {auxPoint = newPoint.GetMax(); newPoint = newPoint.GetMin();}
        if (!(newPoint instanceof TypeXYZw)) {return;}
        if (!min || !max) {min = newPoint.GetCopy(); max = (auxPoint)? auxPoint.GetCopy() : newPoint.GetCopy(); return this;} //Trivial case
        
        min.SetMin(newPoint); if (auxPoint) {min.SetMin(auxPoint);}
        max.SetMax(newPoint); if (auxPoint) {max.SetMax(auxPoint);}
        return this;
    }
    this.toString = function ()
    {
        var  result  = '[Object TypeBoundingBox]';
             result += 'Min point: '+min+'\n';
             result += 'Max point: '+max+'\n';
        return result;
    }
}
//------------------------------------------------------------------------------------------
function TypeCentroid ()
{
    //Privte properties
    var position; //A TypeXYZw point
    var weight;   //The number of points that contributed to the position so far
    
    //Public methods
    this.GetPosition = function () {return position;}
    this.GetWeight   = function () {return weight;}
    this.Reset       = function () {position = weight = void(0);}
    this.Update      = function (newPoint)
    {
        //Note: Can receive another centroid object
        
        let otherWeight = 1;
        
        if (  newPoint instanceof TypeCentroid) {otherWeight = newPoint.GetWeight(); newPoint = newPoint.GetPosition();}
        if (!(newPoint instanceof TypeXYZw)) {return;}
        if (!position) {position = newPoint.GetCopy(); weight = otherWeight; return this;} //Trivial case
        
        //Note: The idea is that if each vertex represents a unit weight then
        //  --> we balance the moment of all previous weights against a single one on a beam
        //  --> So that if x+y = beamLength, x*cummWeight = y * weight --> delta = weight / (cumWeight+weight)
        let delta = newPoint.Minus(position).ScaleBy(otherWeight/(weight+otherWeight));
        position  = position.Plus (delta);
        weight   += otherWeight;
        return this;
    }
    this.toString    = function ()
    {
        var result  = '[Object TypeCentroid]\n';
            result += 'Position: '+position+'\n';
            result += 'Weight  : '+Weight;
        return result;
    }
}
//------------------------------------------------------------------------------------------
function TypeText()
{   
    //Private properties
    var textString;
    var textBox; 
    var textHeight;
    
    //Private methods
    var Initialize   = function ()
    {
        textString = '';
        textHeight = 0.1; //in world units
        textBox    = {
            position:new TypeXYZw(),
            width:void(0), 
            height:void(0), 
            normX:void(0), 
            normY:void(0),
            wrapText:false};
    }
    
    //Public properties
    this.name;
    
    //Public methods
    this.SetText     = function (newText) {if (!IsString(newText)) {return;} textString = newText; return this; }
    this.SetPosition = function (newPos)  {if (!(newPos instanceof TypeXYZw)){newPos = new TypeXYZw(newPos);} textBox.position = newPos; return this; }
    
    this.GetText     = function ()        {return testString;}
    this.GetPosition = function ()        {return textBox.position;}
}
//------------------------------------------------------------------------------------------
function TypeCurve()
{   //Holds a vertex sequence that represents a curve (including points, lines, polylines, smooth curves)
    //Allows a basic form of parametric representation, where vertices are used to store construction information of a curve (computed curve)
    //With computed curves space is saved when data is sent for 2d drawing (like canvas2d which has its own path facility) and allows for resizing of shapes like circles and rectangles
    
    //Note: Computed types imply that the vertices are used as the basis to add more points in between (interpolated, bezier, smooth curves)
    //Note: Parametric types imply (additionally from the computed) that the vertices contain shape paramters that need to be interpreted (such as circle radius, rectangle corner radius etc)
    
    //Design notes:
    //Note: The current design offers a balance of compactness and conceptual simplicity (restricting to only one type at the time). It is limiting because it doesn't allow, say, a circle to be drawn as points
    //Note: Having a 'ParametricShapeArr' might make this more flexible (as long as there is a good, compact, computationally light way to represent 'particles')
    //Note: Fragmenting the vertices array into multiple arrays (freeform, particles, shapes) might have some merit
    //Note: Storing objects and arguments in the 'w' of a vertex 'feels' non-elegant, then again as long as it doesn't leak outside this object it shouldn't matter (?)
    //Note: The vertex array *must* always be uniform and contain only vertices (points in space), and not a mix of vertices and vectors (points linked to the origin). This simplifies the planarity checks. 
    
    //Private properties
    var vertices    = []; //an array of vertices
    var centroid    = new TypeCentroid(); 
    var boundingBox = new TypeBoundingBox(); //World aligned
    var content     = {type :void(0), plane:new TypePlane(), isClosed:void(0)}; //An object acting as a table of contents
    //content.type --> a string for the type of curve. Current implemetation restricts to only one thing (points, lines, polylines, interpolated, etc)

    //Public methods;
    this.name;
        
    //Private methods
    var cloneVertexArr       = function ()
    {   //Copy the vertex array verbatim
        var vertCount = vertices.length;
        var resultArr = [];
        
        for (let i=0; i<vertCount; i++) {resultArr.push(new TypeXYZw(vertices[i]));}
        return resultArr;
    }
    var ComputeBoundboxAndCentroid = function (thisMany)
    {   //Updates the bounding box and centroid for the last 'thisMany' objects
        //Note: This method deals with objects (unlike checkPlanar that only needs to understand vertices)
        
        var vertCount  = vertices.length; if (vertCount==0) {return;}
        var parametric = IsParametricType();
        var step       = (parametric && content.type!='Particle')? 3 : 1;
        var startIdx   = (!thisMany || vertCount-step*thisMany<0)? 0:vertCount-step*thisMany;

        for (let i=startIdx; i<vertCount; i+=step)
        {
            let weight   = 1; //A single vertex counts as 1, parametric objects count as their circumference
            let currVert = vertices[i];
            let computedBoxAndCentroid;

            if (parametric && content.type=='Ellipse')     {computedBoxAndCentroid = GenerateArcPoints(vertices[i],vertices[i+1],vertices[i+2],vertices[i].w,vertices[i+1].w,false,false);} else
            if (parametric && content.type=='RegularNgon') {computedBoxAndCentroid = GenerateArcPoints(vertices[i],vertices[i+1],vertices[i+2],vertices[i].w,vertices[i+1].w,true,true);} else
            if (parametric && content.type=='Circle')      {computedBoxAndCentroid = GenerateArcPoints(vertices[i],vertices[i+1],vertices[i+2],vertices[i].w,vertices[i+1].w,false,true);} else
            if (parametric && content.type=='Rectangle')   {computedBoxAndCentroid = GenerateRectangle(vertices[i],vertices[i+1],vertices[i+2],vertices[i+2].w,vertices[i].w);}
            
            if (computedBoxAndCentroid) {boundingBox.Update(computedBoxAndCentroid.boundBox); centroid.Update(computedBoxAndCentroid.centroid);}
            else                        {boundingBox.Update(currVert);                        centroid.Update(currVert);}
        }
    }
    var ComputedVertexArray = function ()
    {   //Returns an array of vertices representing the computed polyline; depending on type
        if (content.type=='Particle')     {return ComputeAsParticle();}
        if (content.type=='Rectangle')    {return ComputeAsRectangle();}
        if (content.type=='Circle')       {return ComputeAsEllipse(true);}
        if (content.type=='Ellipse')      {return ComputeAsEllipse();}
        if (content.type=='Interpolated') {return ComputeAsInterpolated();}
        if (content.type=='Bezier')       {return ComputeAsBezier();}
        if (content.type=='B-Spline')     {return ComputeAsBspline();}
        if (content.type=='RegularNgon')  {return ComputeAsRegularNgon();}
        
        //Raw vertices. No computation needed
        if (content.type=='Point' || content.type=='Line' || content.type=='Polyline' || content.type===void(0)) {Say('WARNING (GetComputedVertArr) Points, Lines, and Polylines do not have a computed vertex array.',-1); return;}
    }
    var ComputeAsParticle    = function ()
    {   
        var vertCount = vertices.length; if (vertCount<2) {return;}
        var resultArr=[]; //an array of TypeXYZw
        
        //Velocity information is store in the 'w'
        for (let i=0; i<vertCount; i++) { resultArr.push(new TypeXYZw(vertices[i].GetAsArray(3))); }
        return resultArr;
    }
    var ComputeAsInterpolated = function () 
    {    //(Cardinal spline) Smooth curve approximation passing through all vertices
        var vertCount = vertices.length; if (vertCount<3) {return;}
        var resultArr=[]; //an array of TypeXYZw
        
        var stepCount     = 8;
        var stepLength    = 1/stepCount;
        var tangentFactor = 3/6;
        var segStart      = 0;
        var segEnd        = vertCount-2;
        
        for (let vertIdx = 0; vertIdx<=vertCount-2;vertIdx++)
        {   //Get successive pairs or vertices. (vertIdx stops at the prior to last index in the array.)
            
            //Four consequtive vertices v0 to v3
            let v0 = vertices[vertIdx-1]; //only used when vertIdx>segStart
            let v1 = vertices[vertIdx+0]; if (v1.IsNaN()) {segStart=vertIdx+1; continue;}
            let v2 = vertices[vertIdx+1];
            let v3 = vertices[vertIdx+2]; if (v3 && v3.IsNaN()) {segEnd = vertIdx;} 
            
            //Tangent vectors at v1 and v2 respectively
            let t1 = (vertIdx==segStart)? v3.Minus(v1).ReflectAbout(v2.Minus(v1)).ScaleBy(tangentFactor) : v2.Minus(v0).ScaleBy(tangentFactor);
            let t2 = (vertIdx==segEnd)?   v2.Minus(v0).ReflectAbout(v2.Minus(v1)).ScaleBy(tangentFactor) : v3.Minus(v1).ScaleBy(tangentFactor);
            
            for (let step = 0; step<stepCount; step++)
            {    //Each segment between two vertices is subdivided into steps 
                let s  = step * stepLength; //s is between 0-1
                //Calculate the Hermite basis functions h1, h2, h3, h4
                let h1 =  2*Math.pow(s,3) - 3*Math.pow(s,2) + 1; // h1 is a scalar; starts at 1 and goes slowly to 0
                let h2 = -2*Math.pow(s,3) + 3*Math.pow(s,2);     // h2 is a scalar; starts at 0 and goes slowly to 1
                let h3 =    Math.pow(s,3) - 2*Math.pow(s,2) + s; // h3 is a scalar affecting the contribution of the tangent vector t1
                let h4 =    Math.pow(s,3) -   Math.pow(s,2);     // h4 is a scalar affecting the contribution of the tangent vector t2
                
                //interpolated point p = h1*v1 + h2*v2 + h3*t1 + h4*t2;
                resultArr.push (v1.ScaleBy(h1).Plus(v2.ScaleBy(h2)).Plus(t1.ScaleBy(h3)).Plus(t2.ScaleBy(h4)));
            }
            if (vertIdx==segEnd) 
            {   //add the very last vertex of this segment (there could be more later)
                resultArr.push(v2); if (segEnd<vertCount-2) {resultArr.push(new TypeXYZw(NaN));} //Termination before the next segment
                //Adjust the bookmarks
                segStart = vertIdx+2; vertIdx++; //Anticipating the next segment
                segEnd   = vertCount-2;
            } 
        }
        return resultArr; //an array of TypeXYZw
    }
    var ComputeAsRegularNgon = function () 
    {
        var vertCount = vertices.length; if (vertCount<3) {return;}
        var resultArr=[]; //an array of TypeXYZw
        
        //Note: information for Ngons is stored as three vertices
        //   -->Vertex1 is the center. 
        //   -->Vertex2 is the radius point with 'w' holding the number of sides
        //   -->Vertex3 is the rudder point defining a plane for the RegularNgon to be on
        for (let i=2; i<vertCount; i+=3)
        {   //Walk through all raw data
            if (i>2) {resultArr.push(new TypeXYZw(NaN) ); } //Polyline terminator for the previous RegularNgon
            
            let cen    = vertices[i-2];
            let radius = vertices[i-1];
            let sides  = vertices[i-1].w;
            let rudder = vertices[i];  
            
            GenerateArcPoints(cen,radius,rudder,2*pi,sides,true,false,resultArr);
        }

        return resultArr;
    }
    var ComputeAsRectangle = function () 
    {   //Computes vertices for all rectangles defined in the vertex array
    
        var vertCount = vertices.length; if (vertCount<3) {return;}
        var resultArr=[]; //an array of TypeXYZw
        
        //Note: Information on rectangles is stored as three vertices
        //  --> Vertex1 is the Lower left corner
        //  --> Vertex2 is the Lower right corner
        //  --> Vertex3 is a point on the top side of the rectangle
        for (let i=2; i<vertCount; i+=3)
        {   //walk through raw data stepping into the third of each tripplet
            if (i>2) {resultArr.push(new TypeXYZw(NaN)); } //Polyline terminator for the previous rectangle
            
            let pointLL   = vertices[i-2];   //vert1
            let pointLR   = vertices[i-1];   //vert2
            let topPoint  = vertices[i];     //vert3
            let radius    = vertices[i].w;   //corner radius
            let viewDist  = vertices[i-2].w; //to determine how many points in the corner radius
            
            //A single rectangle
            GenerateRectangle(pointLL,pointLR,topPoint,radius,viewDist,resultArr);
        }

        return resultArr;
    }
    var GenerateRectangle  = function (pointLL,pointLR,topPoint,radius,viewDist,resultArr)
    {   //Helper method for ComputeAsRectangle
        //Computes vertices for a single rectangle
    
        let vecLLtoLR  = pointLR.Minus(pointLL);
        let pointTL    = topPoint.Minus(pointLL).AsOrthoTo(vecLLtoLR).Plus(pointLL); //Orthogonalize
        let vecLLtoTL  = pointTL.Minus(pointLL);
        let pointTR    = pointTL.Plus(vecLLtoLR);
        let tolerance  = pointLL.GetTolerance();

        let computedBoxAndCentroid = {boundBox:new TypeBoundingBox(),centroid:new TypeCentroid()}
        
        //SHARP rectangle.
        if (Math.abs(radius)<tolerance) 
        {
            computedBoxAndCentroid.boundBox.Update(pointLL).Update(pointLR).Update(pointTR).Update(pointTL);
            computedBoxAndCentroid.centroid.Update(pointLL).Update(pointLR).Update(pointTR).Update(pointTL);
            if (resultArr) {resultArr.push(pointLL,pointLR,pointTR,pointTL);}
            return computedBoxAndCentroid;
        } 
        
        //ROUNDED rectangle. (essentially just four arcs)
        //Lower left corner
        let radiusVecU     = vecLLtoLR.ResizeTo(radius);
        let radiusVecV     = vecLLtoTL.ResizeTo(radius);
        let arcRadiusPoint = pointLL.Plus(radiusVecV);
        let arcRudderPoint = pointLL.Plus(radiusVecU);
        let arcCenPoint    = arcRadiusPoint.Plus(radiusVecU);
        let tempBoxCenObj  = GenerateArcPoints(arcCenPoint,arcRadiusPoint,arcRudderPoint,90*degToRad,viewDist,false,false,resultArr);
        computedBoxAndCentroid.boundBox.Update(tempBoxCenObj.boundBox);
        computedBoxAndCentroid.centroid.Update(tempBoxCenObj.centroid);
        
        //Lower right corner
        arcRadiusPoint = pointLR.Minus(radiusVecU);
        arcRudderPoint = pointLR.Plus(radiusVecV);
        arcCenPoint    = arcRadiusPoint.Plus(radiusVecV);
        tempBoxCenObj  = GenerateArcPoints(arcCenPoint,arcRadiusPoint,arcRudderPoint,90*degToRad,viewDist,false,false,resultArr);
        computedBoxAndCentroid.boundBox.Update(tempBoxCenObj.boundBox);
        computedBoxAndCentroid.centroid.Update(tempBoxCenObj.centroid);
        
        //Top right corner
        arcRadiusPoint = pointTR.Minus(radiusVecV);
        arcRudderPoint = pointTR.Minus(radiusVecU);
        arcCenPoint    = arcRadiusPoint.Minus(radiusVecU);
        tempBoxCenObj  = GenerateArcPoints(arcCenPoint,arcRadiusPoint,arcRudderPoint,90*degToRad,viewDist,false,false,resultArr);
        computedBoxAndCentroid.boundBox.Update(tempBoxCenObj.boundBox);
        computedBoxAndCentroid.centroid.Update(tempBoxCenObj.centroid);
        
        //Top left corner
        arcRadiusPoint = pointTL.Plus(radiusVecU);
        arcRudderPoint = pointTL.Minus(radiusVecV);
        arcCenPoint    = arcRadiusPoint.Minus(radiusVecV);
        tempBoxCenObj  = GenerateArcPoints(arcCenPoint,arcRadiusPoint,arcRudderPoint,90*degToRad,viewDist,false,false,resultArr);
        computedBoxAndCentroid.boundBox.Update(tempBoxCenObj.boundBox);
        computedBoxAndCentroid.centroid.Update(tempBoxCenObj.centroid);
        
        return computedBoxAndCentroid;
    }
    var ComputeAsEllipse   = function (forceToCircle)
    {
        var vertCount = vertices.length; if (vertCount<3) {return;}
        var resultArr=[]; //an array of TypeXYZw
        
        //Note: information for circle is stored as three vertices
        //   -->Vertex1 is the center point with w holding the how many degrees of circle (arc) to form
        //   -->Vertex2 is the radius point with 'w' holding the viewingDistance
        //   -->Vertex3 is the rudder point defining a plane for the circle to be on
        for (let i=2; i<vertCount; i+=3)
        {   //Walk through all raw data
            if (i>2) {resultArr.push(new TypeXYZw(NaN) ); } //Polyline terminator for the previous circle
             
            let cen      = vertices[i-2];   //vert1
            let radius   = vertices[i-1];   //vert2
            let rudder   = vertices[ i ];   //vert3
            let viewDist = vertices[i-1].w;
            let radAngle = vertices[i-2].w;
            
            //Compute vertices
            //Note: The resultArr is augmented with new points
            GenerateArcPoints(cen,radius,rudder,radAngle,viewDist,false,forceToCircle,resultArr);
        }

        return resultArr;
    }
    var GenerateArcPoints  = function (centerPoint,radiusPoint,rudderPoint,arcAngle,resolutionParam,asSides,makeCircular,resultArr)
    {   //Helper method for ComputeAsCircle and ComputeAsRectangle
        //Note: resolution parameter is either a viewing distance of the the number of sides

        let radiusVec  = radiusPoint.Minus(centerPoint);
        let rudderVec  = rudderPoint.Minus(centerPoint).AsOrthoTo(radiusVec); //convert rudder point to vector
        let sides      = (asSides==true)? (resolutionParam<3)? 3 : resolutionParam : Math.floor(64 * Math.sqrt(radiusVec.Length()/resolutionParam) * (arcAngle/(360*degToRad)) ); 
        let cordAngle  = arcAngle/sides; //radians
        let computedBoxAndCentroid = {boundBox:new TypeBoundingBox(),centroid:new TypeCentroid()}
        
        if (makeCircular) {rudderVec.ResizeTo(radiusVec.Length());}
        
        for (let runningAngle=0;runningAngle<=arcAngle;runningAngle+=cordAngle)
        {   //walk through al cords to form the full arc
            let arcPoint = centerPoint.Plus(radiusVec.RotThruPoint(rudderVec,runningAngle));

            if (resultArr) {resultArr.push( arcPoint );}
            computedBoxAndCentroid.boundBox.Update(arcPoint);
            computedBoxAndCentroid.centroid.Update(arcPoint);
        }
        return computedBoxAndCentroid;
    }
    var ComputeAsBezier    = function () {Say('WARNING: Bezier curves have not been implemented yet',-1); return [];}
    var ComputeAsBspline   = function () {Say('WARNING: B-Splines have not been implemented yet',-1); return [];}
    var ChangeType         = function (newType)
    {
        if (newType==content.type) {return true;} //Nothing to do
        if (vertices.length==0) {content.type = newType; return true;} //Trivial case (the very first assignment of type)
        //After this point, there are existing vertices and the types are different
        
        if (content.type=='Particle' || newType=='Particle') {Say('WARNING: (ChangeType) Cannot switch away from, or to, <Particle> It\'s vertex interpetation is not meaningful to any other types',-1); return false;}
        if (content.type=='Rectangle' || content.type=='RegularNgon' || content.type=='Circle' || content.type=='Ellipse') {return ConvertToType(newType);}

        //The other types are switchable
        content.type = newType;
        return true;
    }
    var ConvertToType        = function (newType)
    {   //Helper method for -->ChangeType()
        
        //Circle <-> Ellipse
        if(newType == 'Circle' && content.type == 'Ellipse' || newType == 'Ellipse' && content.type == 'Circle') {content.type = newType; return true;}
        
        //From parametric to other parametric is not alllowed
        if (newType=='Rectangle' || newType=='RegularNgon' || newType=='Circle') {Say('WARNING: (ChangeType) Cannot switch type from <'+content.type+'> to <'+newType+'>. Their vertex interpretations are incompatible',-1); return false;}
        
        //From parametric to a simpler type
        var result = ComputedVertexArray(); //Will convert the original type from Rectangle, RegularNgon, or Circle --> to polyline (regardless of whether newType is Polyline or line, or interpolated)
        if (result!==void(0)) {vertices = result; content.type = newType; return true;} else {return false;}
    }
    var CheckPlanar        = function (thisMany) {return content.plane.Has(vertices,false,thisMany);} //check 'thisMany' from the end of the vertices array
    var IsParametricType   = function ()     {return (content.type=='Particle' || content.type=='Circle' || content.type=='Rectangle' || content.type=='RegularNgon' || content.type=='Graph')? true:false;}
    var IsComputedType     = function ()     {return (IsParametricType() || content.type=='Interpolated' || content.type=='Bezier' || content.type=='B-Spline')? true:false;}

    //Public methods
    //this.SetAsParticle     = function ()     {ChangeType('Particle');}     //(point,velocity)
    //this.SetAsCircle       = function ()     {ChangeType('Circle');}       //(center, radius) as circles.
    //this.SetAsRegularNgon  = function ()     {ChangeType('RegularNgon');}  //(center, radius) as RegularNgons. Sides stored in radius.w
    //this.SetAsRectangle    = function ()     {ChangeType('Rectangle');}    //(LLcorner, LRcorner, topPoint) as rectangles. topPoint.w = cornerRadius.
    this.IsClosed          = function ()     {return (content.isClosed)? true:false;} //Test explicitly for false. ( void(0) should not cause true )
    this.IsPlanar          = function ()     {return content.plane.IsStarted();}   //a single point is technically planar to all planes through it
    this.RegenPlanarCheck  = function ()     {CheckPlanar();}              //Runs a planarity check on all vertices from scratch
    this.SetAsPoint        = function ()     {ChangeType('Point');}        //interpreted as points
    this.SetAsLine         = function ()     {ChangeType('Line');}         //interprested as lines
    this.SetAsInterpolated = function ()     {ChangeType('Interpolated');} //A single curve (a NaN vertex could be interpreted as termination)
    this.SetAsBezier       = function ()     {ChangeType('Bezier');}       //A single curve (a NaN vertex could be interpreted as termination)
    this.SetAsBspline      = function ()     {ChangeType('B-Spline');}     //A single curve (a NaN vertex could be interpreted as termination)
    this.SetAsPolyline     = function ()     {ChangeType('Polyline');}     //A single polyline (a NaN vertex could be interpreted as termination)
    
    this.GetBoundingBox    = function ()     {return boundingBox;}
    this.GetCentroid       = function ()     {return centroid;}
    this.GetVertexCount    = function ()     {return vertices.length;}
    this.GetVertex         = function (idx)  {return vertices[idx];} //Returns the actual TypeXYZw point object (caution: its values could be changed by the client)
    this.GetComputedVertArr= function ()     {return ComputedVertexArray();}
    this.GetZdepth         = function ()     {return content.plane.GetZdepth();}
    this.GetPlane          = function ()     {return content.plane;}
    this.GetType           = function ()
    {
        if (content.type !== void(0)) {return content.type;}
        var vertCount = vertices.length;
        if (vertCount==0) {return void(0);}
        if (vertCount==1) {return 'Point';}
        if (vertCount==2) {return 'Line';}
        if (vertCount >2) {return 'Polyline';}
    }
    this.AddParticle       = function (position,velocity)
    {
        //Check for type missmatch
        if (!ChangeType('Particle')) {return;}
        
        //Argument clean up
        if (!(position instanceof TypeXYZw)) {position = new TypeXYZw();}
        if (!(velocity instanceof TypeXYZw)) {position = new TypeXYZw();}
        
        position.w = velocity; //Store the entire velocity vector as w
        vertices.push(position);
        
        CheckPlanar(1); 
        ComputeBoundboxAndCentroid(1);
        return this;
    }
    this.AddPoint          = function (newPoint)
    {   //Same as addVertex but the type is being set to 'point'
        if (!ChangeType('Point')) {return;}  //Check for type missmatch
        if (!(newPoint instanceof TypeXYZw)) {newPoint = new TypeXYZw(newPoint);} //Argument clean up
        
        vertices.push(newPoint);
        
        CheckPlanar(1); 
        ComputeBoundboxAndCentroid(1);
        return this;
    }
    this.AddVertex         = function (newVertex)
    {   //Add a new vertex generically (No specific type given)
        if (content.type!==void(0)) {Say('CAUTION: (AddVertex) Raw vertices are being added to a curve type previously declared as <'+content.type+'>',-1);}
        if (!(newVertex instanceof TypeXYZw)) {newVertex = new TypeXYZw (newVertex);} //Argument clean up    
        
        vertices.push (newVertex);
        
        CheckPlanar(1); 
        ComputeBoundboxAndCentroid(1);
        return this;
    }
    this.AddCircle         = function (centerPoint,radiusPoint,rudderPoint,arcAngleRad,viewingDistance) {this.AddEllipse(centerPoint,radiusPoint,rudderPoint,arcAngleRad,viewingDistance,true);}
    this.AddEllipse        = function (centerPoint,radiusPoint,rudderPoint,arcAngleRad,viewingDistance,asCircle)
    {
        //Note: A circle is a special case of ellipse. They both store identically in the vertex array
        
        //Check for type missmatch
        if (!asCircle && !ChangeType('Ellipse')) {return;} else if ( asCircle && !ChangeType('Circle')) {return;}
        
        //Argument clean up
        if(!(centerPoint instanceof TypeXYZw)) {centerPoint = new TypeXYZw(centerPoint);}
        if(!(radiusPoint instanceof TypeXYZw)) {radiusPoint = new TypeXYZw(radiusPoint);} if(radiusPoint.IsEqual(centerPoint)) {Say('WARNING: '+((asCircle)? '(AddCircle)':'(AddEllipse)')+'Supplied radius point coincides with the center point',-1); return;} 
        if(!(rudderPoint instanceof TypeXYZw)) {rudderPoint = new TypeXYZw(rudderPoint);} if(rudderPoint.IsCollinear(centerPoint,radiusPoint)) {Say('WARNING: '+((asCircle)? '(AddCircle)':'(AddEllipse)')+' Supplied rudder point is collinear to center and radius points and doesn\'t define a plane',-1); return;}
        arcAngleRad     = Number(arcAngleRad); //In radians
        viewingDistance = Number(viewingDistance); 
        var radiusLen   = radiusPoint.Minus(centerPoint).Length(); 
        if (Number.isNaN(viewingDistance) || viewingDistance<radiusLen) {viewingDistance = 4*radiusLen;}
        if (Number.isNaN(arcAngleRad) || Math.abs(arcAngleRad)>360*degToRad) {arcAngleRad = 360*degToRad;}
        
        //Note: Partial circle arc degrees is stored in centerPoint.w. Viewing distance is storred in radiusPoint.w
        //Note: radiusPoint is point in space and not a vector 
        //Note: The polygonal approximation would follow the formula --> NumOfSides = 64 * sqrt( radiusLen/viewingDistance )
        centerPoint.w = arcAngleRad;
        radiusPoint.w = viewingDistance;
        vertices.push(centerPoint,radiusPoint,rudderPoint);
        
        if (content.isClosed===void(0)) {content.isClosed=true;}
        CheckPlanar(3); 
        ComputeBoundboxAndCentroid(1); //One ellipse
        return this;
    }
    this.AddRegularNgon     = function (centerPoint,radiusPoint,rudderPoint,sideCount)
    {   //Creates a RegularNgon of specified sides count in the vertex array
    
        //Check for type missmatch
        if (!ChangeType('RegularNgon')) {return;}
        
        //Argument clean up
        if(!(centerPoint instanceof TypeXYZw)) {centerPoint = new TypeXYZw(centerPoint);}
        if(!(radiusPoint instanceof TypeXYZw)) {radiusPoint = new TypeXYZw(radiusPoint);} if(radiusPoint.IsEqual(centerPoint)) {Say('WARNING: (AddRegularNgon) Supplied radius point coincides with the center point',-1); return;} 
        if(!(rudderPoint instanceof TypeXYZw)) {rudderPoint = new TypeXYZw(rudderPoint);} if(rudderPoint.IsCollinear(centerPoint,radiusPoint)) {Say('WARNING: (AddRegularNgon) Supplied rudder point is collinear to center and radius points and doesn\'t define a plane',-1); return;}
        sideCount = Math.floor(sideCount); if (Number.isNaN(sideCount) || sideCount<3) {Say('WARNING: (AddRegularNgon) No valid sides count was provided',-1); return;}
        
        //Note: radius is point in space and not a vector 
        radiusPoint.w = sideCount;                          //Store the sides in the 'w' of the radius point
        vertices.push(centerPoint,radiusPoint,rudderPoint); //Push the tripplet into the vertex array
        
        if (content.isClosed===void(0)) {content.isClosed=true;}
        CheckPlanar(3); 
        ComputeBoundboxAndCentroid(1); //One Ngon
        return this;
    }
    this.AddRectangle       = function (pointLL, pointLR, topPoint, cornerRadius, viewingDistance)
    {   
        //Check for type missmatch
        if (!ChangeType('Rectangle')) {return;}

        //Argument clean up
        if(!(pointLL instanceof TypeXYZw)) {pointLL = new TypeXYZw(pointLL);}
        if(!(pointLR instanceof TypeXYZw)) {pointLR = new TypeXYZw(pointLR);} if(pointLR.IsEqual(pointLL)) {Say('WARNING: (AddRectangle) Supplied radius point coincides with the center point',-1); return;}
        if(!(topPoint instanceof TypeXYZw)) {topPoint = new TypeXYZw(topPoint);} if(topPoint.IsCollinear(pointLL,pointLR)) {Say('WARNING: (AddRectangle) Supplied top point is collinear to lower left point and lower right points and does not define a plane',-1); return;}
        if(cornerRadius===void(0) || cornerRadius<0) {cornerRadius=0;}
        if(viewingDistance===void(0) || viewingDistance<0.01) {viewingDistance=1;}
        
        //topPoint is any point on the top side of a rectangle
        pointLL.w  = viewingDistance; //store the viewingDistance
        topPoint.w = cornerRadius;    //store the corner radius
        vertices.push(pointLL,pointLR,topPoint);
        
        if (content.isClosed===void(0)) {content.isClosed=true;}
        CheckPlanar(3); 
        ComputeBoundboxAndCentroid(1); //One rectangle
        return this;
    }
    this.toString           = function ()
    {
        var result = '[Object TypeCurve]\n';
           result += 'Name          = '+this.name+'\n';
           result += 'Vertex count  = '+vertices.length+'\n';
           result += 'Curve type    = '+this.GetType()+'\n';
           result += 'Is Closed     = '+content.isClosed+'\n';
           result += 'Is parametric = '+IsParametricType()+'\n';
           result += 'Is computed   = '+IsComputedType()+'\n';
           result += 'Is planar     = '+((this.IsPlanar())? true:false)+'\n';
           result += 'Plane         = '+content.plane+'\n';
           result += 'Z depth       = '+this.GetZdepth()+'\n';
           result += 'Raw vertices:\n';
           result += vertices;
        return result;
    }
}
//------------------------------------------------------------------------------------------
function TypeSurface()
{   //A surface oobject with either explicitly defined vertices and mesh, or derived vertices and mesh
    
    //Design notes:
    //Note: The construction array is a way to use curves to make surfaces
    //Note: The construction steps could be stand alone or build on the previous (planar fill is stand alone, extrusions could build on the previous step)
    //Note: There are two competing design ideas. a) keep the surface uniform by allowing only freestyle vertices, or construction history. b) provide a second array 'computedVertArr' and allow both freestyle and construction history
    //Note: Currently the surface is being kept as one type at the time. This way there is only one vertex array and we know where the vertices came from and what to do with them and how to index them for the world and for the Normals and UVs arrays
    //Note: If the surface was allowed to be a mix, would it be worth the added logistic complexity ? How often would mix surfaces be necessary and for what applications ?
    //Note: If the surface was allowed to be a mix, there would likely need to be an intermediate method dedicated to indexing and be able to treat the two arrays (vertices and computedVertArr) as if they were appended.
    //Note: If the surface was allowed to be a mix, the 'EliminateVertexSharing' method would have to be reworked to operate on both arrays independently

    //PRIVATE properties
    var geometry;           //Object
    var constructionArr;    //an array of objects containing the methodRef and arguments to use to construct the surface
    
    //PUBLIC properties
    this.name;              //a string to hold a name for the surface if need be
    
    //PRIVATE methods
    var Initialize = function ()
    {
        geometry = 
        {
            vertices   :[],           //an array of vertices (this is just a point cloud and means not much by itself without mesh information)
            mesh       :[],           //an array of vertex indexes (every three indexes is a triangle). This is what actually defines the shape of the surface.
            edges      :void(0),      //an array of vertexIdx arrays each representing a surface edge (there can be many edges or holes to a surface). Construction curves are not necessarily edges.
            centroid   :new TypeCentroid(),
            boundingBox:new TypeBoundingBox(),           
            content    : {            //Object acting as a table of contents
                type    :void(0),     //classification description, freeform, parametric3d:(sphere, box, cylinder, cone, elipsoid), parametric2d:(rectangle,disk,RegularNgon,)
                isClosed:void(0),     //Open surface or closed (volume)
                plane   :new TypePlane()} //If the entire surface is planar, this is the plane it is on
        }
        constructionArr=[];           //Array of objects {name:methodName, method:methodRef, args:methodArgumentsArr}. The method and arguments to be used to construct the vertices from scratch (out of curves)
    }
    var NewConstructionObject     = function (methodName, methodRef, methodArgumentsArr) {return {name:methodName, method:methodRef, args:methodArgumentsArr, isInflated:false}; }
    var InflateConstructionArray  = function (regenAll)
    {   //Generate geometry (vertices and mesh) from the construction array
        //Note: By design a surface object contains either freeform vertices or construction objects (not both)
        //Note: When there are construction steps in constructionArr, the geometry.vertices array remains empty (no free-form vertices are allowed to be added), but can be populated with computed vertices from the constructonArr

        var constrStepCount = constructionArr.length;
        if (!regenAll && (constrStepCount == 0 || constructionArr[constrStepCount-1].isInflated)) {return;} //Nothing to do (either there is no construction, or the last construction step has been inflated already)
        if (regenAll) {geometry.vertices = geometry.mesh = geometry.edges = []; centroid.Reset(); boundingBox.Reset();} //Reset
    
        for (let i=0; i<constrStepCount; i++)
        {
            if (constructionArr[i].isInflated && !regenAll) {continue;}
            //To DO ....
        }
    }
    var ComputeFromPlanarBoundary = function (boundCurve)
    {   //Generate vertices and mesh from planar boundary (triangulation)
        Say('WARNING: (ComputeFromPlanarBoundary) Has not been implemented yet',-1);
        //To DO ....
    }
    var ComputeBoundboxAndCentroid = function (thisMany)
    {   //Calculates/Udates the bounding box and centroid of the surface

        var isDerivative = (constructionArr.length>0)? true : false;
        var count        = (isDerivative)? constructionArr.length : geometry.vertices.length; if (vertCount==0) {return;}
        var startIdx     = (!thisMany || count-thisMany<0)? 0 : count-thisMany;
        
        for (let i=startIdx; i<count; i++)
        {   //Walk through each vertex in the vertex array
            //or walk through each construction step in the construction array
            
            if (!isDerivative)
            {   //Vertices
                let currentVert = geometry.vertices[i];
                geometry.boundingBox.Update(currentVert);
                geometry.centroid.Update(currentVert);
            }
            else if (constructionArr[i].methodName=='ComputeFromPlanarBoundary')
            {   //Construction array boundary curves
                let boundaryCurve = constructionArr[i].args[0];
                geometry.boundingBox.Update(boundaryCurve.GetBoundingBox());
                geometry.centroid.Update(boundaryCurve.GetCentroid());
            }
        }
    }
    var CheckPlanar             = function (query)
    {   //Check the local comparison plane against 'query'
        //Note: 'query' could be either a number (for how many vertices to check from the end of geometry.vertices), or a plane object (from a construction curve object), or an array of vertices  
        //Construction history curve objects are checked (as added) by passing their plane as 'query'
        
        //Check a subset
        if (!isNaN(query)) {return geometry.content.plane.Has(geometry.vertices,false,query);} //'query' represents (a number) an endCount for geometry.vertices
        else if (query!==void(0)) {return geometry.content.plane.Has(query,false);} //'query' is either a plane or an array. (if 'query' is incomprehenisble, will return false)
        
        //Check all from scratch
        //The entire vertex array
        if (!geometry.content.plane.Has(geometry.vertices,false)) {return;}
        
        //The construction array
        var stepCount = constructionArr.length;
        for (let i=0; i<stepCount; i++)
        {   //Walk through all construction steps
            let constrCrv;
            let argCount = constructionArr[i].args.length;
            for (let j=0; j<argCount; j++) {let oneArg = constructionArr[i].args[j]; if (oneArg instanceof TypeCurve) {constrCrv=oneArg;} } //find a curve object in the arguments
            if (constrCrv && !geometry.content.plane.Has(constrCrv.GetPlane(),false)) {return;} //Check the curve plane against the surface plane
        }
    }
    var AddTriangleMesh   = function (idx1, idx2, idx3)
    {   //This method only adds the mesh from pre-existing vertex indexes
        
        idx1 = Number(idx1);
        idx2 = Number(idx2);
        idx3 = Number(idx3);
        
        var maxIdx = geometry.vertices.length-1;
        if (Number.isNaN(idx1) || Number.isNaN(idx2) || Number.isNaN(idx3)) {Say('WARNING: (AddTriangleMesh) Received a NaN index',-1); return;}
        if ((idx1<0 || idx1>maxIdx) || (idx2<0 || idx2>maxIdx) || (idx3<0 || idx3>maxIdx)) {Say('WARNING: (AddTriangleMesh) Out of range index. Received values ['+idx1+', '+idx2+', '+idx3+'], (max value must be <= '+maxIdx+')',-1); return;}
        if (idx1 == idx2 || idx1==idx3 || idx2==idx3) {Say('WARNING: (AddTriangleMesh) Received indices with stacked vertices',-1);return;}
        
        //geometry.mesh is currently a flat array of vertex indexes (every three being a triangle)
        //At some point this might have to change into an array of triangles [a,b,c]. For now it is what it is. We'll see.
        geometry.mesh.push(idx1, idx2, idx3);
    }
    
    //PUBLIC methods
    this.RegenPlanarCheck  = function ()        {return CheckPlanar();}
    this.IsDerivative      = function ()        {return (constructionArr.length>0)? true:false;}
    this.IsPlanar          = function ()        {return geometry.content.plane.IsStarted();}
    this.GetZdepth         = function ()        {return geometry.content.plane.GetZdepth();}
    this.GetPlane          = function ()        {return geometry.content.plane;}
    this.GetCentroid       = function ()        {return geometry.centroid;}
    this.GetBoundingBox    = function ()        {return geometry.boundingBox;}
    this.GetVertexCount    = function ()        {return InflateConstructionArray(); geometry.vertices.length;}
    this.GetMeshSize       = function ()        {return InflateConstructionArray(); geometry.mesh.length;} 
    this.GetMeshTriCount   = function ()        {return InflateConstructionArray(); geometry.mesh.length/3;} //Number of mesh triangles
    this.GetEdgeCount      = function ()        {return (IsArray(geometry.edges))? geometry.edges.length:-1;}
    this.GetVertex         = function (vertIdx) {return geometry.vertices[vertIdx];}
    this.GetMeshValue      = function (meshIdx) {return geometry.mesh[meshIdx];}
    this.GetVertexFromMesh = function (meshIdx) {return (this.GetMeshSize()>0)? geometry.vertices[geometry.mesh[meshIdx]]:void(0);}
    this.GetType           = function ()        {return geometry.content.type;}
    this.GetBoundaryCurves = function ()        
    {   //Returns an array of all planar boundary curves used to construct this surface object
        var boundaryCurves  = [];
        var constrStepCount = constructionArr.length;
        for (let i=0; i<constrStepCount; i++)
        {
            if (constructionArr[i].name != 'ComputeFromPlanarBoundary') {continue;}
            boundaryCurves.push(constructionArr[i].args[0]);
        }
        return boundaryCurves;
    } 
    this.GetMeshTriangle   = function (triIdx)  
    {    //This method looks into the flat geometry.mesh array and returns a triangle as an array [a,b,c]
        //Essentially this method treats the flat array as an array of arrays manually
        InflateConstructionArray(); 
        triIdx = Number(triIdx);
        meshIdx = triIdx*3; 
        triangleCount = this.GetMeshTriCount();
        return (triIdx>0 && triIdx<triangleCount-1)? [geometry.mesh[meshIdx],geometry.mesh[meshIdx+1],geometry.mesh[meshIdx+2]] :void(0);
    }
    this.AddFillFromPlanarBoundary = function (bCurve) 
    {   //Method that adds a construction history command
        //Takes a closed planar boundary curve and adds the 'ComputeFromPlanarBoundary' method to the construction array
        
        //Entrance gate
        //Note: An arbitrary decision was made to keep the surface object as either a freestyle object or a derivative object,  but not both (might change in the future)
        if (geometry.vertices.length>0 && constructionArr.length==0) {Say('WARNING: (AddFillFromPlanarBoundary) Not allowed to add a derivative surface from curves. This surface was previously defined with freestyle vertices'); return;}
        if (!(bCurve instanceof TypeCurve && bCurve.IsClosed())) {Say('WARNING: (AddFillFromPlanarBoundary) Did not receive a closed planar curve',-1); return;} 
        
        var constObject = NewConstructionObject('ComputeFromPlanarBoundary',ComputeFromPlanarBoundary,[bCurve]); //No need to bind the 'this' context since 'ComputeFromPlanarBoundary' is a private method that doesn't rely on 'this' (its closure is enough)
        constructionArr.push(constObject);
        
        ComputeBoundboxAndCentroid(1);
        CheckPlanar(bCurve.GetPlane()); //Testing against the plane of the construction curve is sufficient
        return this;
    }
    this.AddVertex         = function (newVertex)
    {   //Adds just a vertex (when building geometry manually, vertex by vertex)
    
        //Entrance gate
        if (constructionArr.length>0) {Say('WARNING: (AddVertex) Not allowed to add freestyle vertices. This surface was previously defined as a derivative surface from construction curves',-1); return;}
        
        if (!(newVertex instanceof TypeXYZw)) {newVertex = new TypeXYZw(newVertex);}
        geometry.vertices.push(newVertex);
        
        ComputeBoundboxAndCentroid(1); 
        CheckPlanar(1);
        return this;
    }
    this.AddMeshFace = function (idx1, idx2, idx3, idx4)
    {   //Adds either a triangle mesh or a quad (converted to triangles) depending on the arguments received (used when building geometry manually)
        //The vertices must be pre-existing

        //Entrance gate
        if (constructionArr.length>0) {Say('WARNING: (AddMeshFace) Not allowed to add freestyle mesh faces. This surface was previously defined as a derivative surface from construction curves',-1); return;}
        
        var argumentCount=0;
        if (IsArray(idx1)) {idx4=idx1[3]; idx3=idx1[2]; idx2=idx1[1]; idx1=idx1[0]}
        for (var i=0;i<4;i++) { if(this.AddMeshFace.arguments[i]!==void(0)) {argumentCount++;} }
        
        if (argumentCount==3) 
        {
            AddTriangleMesh(idx1,idx2,idx3);
            return this;
        }
        if (argumentCount==4) 
        {
            //For a quad: Assume the parameters received go around the perimeter of the quad and they do not jump
            //if the vertices are stored as follows in 3d space
            //2 4
            //1 3
            //then 4,2,1,3 could be the values in idx1,idx2,idx3,idx4 (or 4,3,1,2 if clockwise); with 4 being the upper right corner of the quad
            //so idx1 and idx3 (representing vertices 4 and 1) and idx2, idx4 (vertices 2 and 3) are on a diagonal
            //the two triangles must share a diagonal
            //so idx1,idx2,idx4 and idx2,idx3,idx4 is a possibility (it works for both clockwise and CCW)
            AddTriangleMesh(idx1,idx2,idx4);    //First triangle
            AddTriangleMesh(idx2,idx3,idx4);    //Second trinagle
            return this;
        }
        
        Say('WARNING: (AddMeshFace) Expected either 3 or 4 arguments but received <'+argumentCount+'>',-1);
    }
    this.AddTriangle = function (vert1,vert2,vert3)
    {    //This method adds a complete shape; both vertices and the mesh indexes
    
        //Surface-type gate
        if (constructionArr.length>0) {Say('WARNING: (AddTriangle) Not allowed to add freestyle triangles. This surface was previously defined as a derivative surface from construction curves',-1); return;}
    
        //Argument gate
        if (this.AddTriangle.arguments.length<3) {Say('WARNING: (AddTriangle) Received insufficient arguments',-1); return;} //Nothing to do with insufficient arguments

        //The AddVertex method also handles argument formating (will convert to TypeXYZw if necessary)
        this.AddVertex(vert1);  this.AddVertex(vert2); this.AddVertex(vert3);
        
        var vCount = this.GetVertexCount();
        AddTriangleMesh (vCount-3, vCount-2, vCount-1)
        return this;
    }
    this.ReverseMeshTriangleWinding = function ()
    {   //The method will reverse the order by which mesh triangles are defined
        //If a triangle was previously defined as vertices a,b,c it now becomes c,b,a
        var meshSize = geometry.mesh.length; if (meshSize<3) {return;}
        for (let i=0; i<meshSize; i+=3)
        {
            let temp           = geometry.mesh[i+2];
            geometry.mesh[i+2] = geometry.mesh[i];
            geometry.mesh[i]   = temp;
        }
        return this;
    }
    this.EliminateVertexSharing = function ()
    {   //This method will create a new mesh where each triangle has unique vertices not shared by any other triangle
        //Will end up with a vertex array the same size as the mesh array
        //if (useMeshArray == false) {Say('WARNING: (EliminateVertexSharing) The mesh array is alredy not in use (it is not causing vertex sharing)',-1); return;} 
        var newVertexArray = [];
        var meshSize = geometry.mesh.length; if (meshSize<3) {return;}

        for (let i=0; i<meshSize; i++)
        {
            if ((i%3)!=2) {continue;} //do any work only when we are on the third vertex of a triangle
            newVertexArray[i-2] = new TypeXYZw( geometry.vertices[ geometry.mesh[i-2] ] );
            newVertexArray[i-1] = new TypeXYZw( geometry.vertices[ geometry.mesh[i-1] ] );
            newVertexArray[i-0] = new TypeXYZw( geometry.vertices[ geometry.mesh[i-0] ] );
            
            geometry.mesh[i-2] = i-2;
            geometry.mesh[i-1] = i-1;
            geometry.mesh[i-0] = i-0;
        }
        geometry.vertices = newVertexArray; //replace the old vertex array with the new one
        return this;
    }
    this.toString = function ()
    {
        var cSteps   = constructionArr.length;
        var result   = '[Object TypeSurface]\n';
             result += 'Name          = '+this.name+'\n';
             result += 'Vertex count  = '+geometry.vertices.length+'\n';
             result += 'Mesh size     = '+geometry.mesh.length+'\n';
             result += 'Edge count    = '+((geometry.edges)? geometry.edges.length : 'undefined')+'\n';
             result += 'Centroid      = '+geometry.centroid+'\n';
             result += 'Bounding Box  = '+geometry.boundingBox+'\n';
             result += 'Surface Type  = '+geometry.content.type+'\n';
             result += 'Is closed     = '+geometry.content.isClosed+'\n';
             result += 'Is derivative = '+geometry.content.isDerivative+'\n';
             result += 'Is planar     = '+this.IsPlanar()+'\n';
             result += 'Plane         = '+geometry.content.plane+'\n';
             result += 'Z-Depth       = '+this.GetZdepth()+'\n';
             result += '++++++++++++++++++++++++++++++\n';
             result += 'Construction step count = '+cSteps+'\n';
             result += '------------------------------\n';
             for (let i=0; i<cSteps; i++) {result += 'Step ['+(i+1)+']\nmethod: '+constructionArr[i].name+'\nArguments: '+constructionArr[i].args+'\n------------------------------\n';}
             result += '++++++++++++++++++++++++++++++\n';
             result += 'Raw vertices  = '+geometry.vertices+'\n';
             result += '------------------------------\n';
             result += 'Raw mesh      = '+geometry.mesh+'\n';
             result += '------------------------------\n';
             result += 'Raw edges     = '+geometry.edges;
        return result;
    }

    //Initialization
    Initialize();
}
//------------------------------------------------------------------------------------------
function TypeSurfaceNormals(targetSrf)
{   //Holds surface normals for a TypeSurface. Handles surface normal manipulation (flip normals, generate normals, facet vs smooth conversion)
    //Is kept separate from TypeSurface for instancing purposes (same surface geometry different normals, or no normals)
    
    //Private properties
    var targetSurface;
    var normalsArr;
    
    //Private methods
    var Initialize = function (Srf)
    {
        if (!(Srf instanceof TypeSurface)) {Say('WARNING: (TypeSurfaceNormals) Object instance did not receive a target surface.',-1); return;}
        targetSurface = Srf;
        normalsArr = [];
    }

    //Public methods
    this.GetNormalsCount    = function ()         {return (normalsArr)? normalsArr.length:-1;}
    this.GetNormalAtVertex  = function (idx)      {return (normalsArr)? normalsArr[Number(idx)]:void(0);}
    this.IsTargetSurface    = function (otherSrf) {return (otherSrf === targetSurface)? true:false;}
    this.GetTarget          = function ()         {return targetSurface;}
    this.FlipNormals        = function (reverseWinding)
    {
        if (!IsArray(normalsArr) || normalsArr.length<1) {return;} //nothing to do
        
        var maxIdx = normalsArr.length-1;
        for (var counter = 0; counter<=maxIdx; counter++)
        {
            if(!(normalsArr[counter] instanceof TypeXYZw)) continue; //in case it is a sparse array
            normalsArr[counter] = normalsArr[counter].ScaleBy(-1);
        }
        if (reverseWinding) {targetSurface.ReverseMeshTriangleWinding();}
    }
    this.GenerateNormals    = function ()
    {    //Takes each triangle in the mesh and creates normals for it (by default normals will point in a direction determined by the cross-product right-hand rule)
        if(targetSurface===void(0)) {Say('WARNING: (GenerateNormals) Cannot generate normals because no target surface has been assigned',-1); return;}

        var triCount = targetSurface.GetMeshTriCount(); 
        if(triCount>=1) {normalsArr = [];}  //Empty the normals array
        else {Say('WARNING: (GenerateNormals) Cannot generate normals. Surface has no mesh triangles.',-1); return;} 
        
        for (let meshIdx=0; meshIdx<triCount; meshIdx++)
        {   //Walk through the mesh array (which contains vertex indexes)
            
            let vertIdxA = targetSurface.GetMeshValue(meshIdx*3);
            let vertIdxB = targetSurface.GetMeshValue(meshIdx*3+1);
            let vertIdxC = targetSurface.GetMeshValue(meshIdx*3+2);
            
            let vertA = targetSurface.GetVertex(vertIdxA);
            let vertB = targetSurface.GetVertex(vertIdxB);
            let vertC = targetSurface.GetVertex(vertIdxC);
            
            let existingNormA = normalsArr[vertIdxA];
            let existingNormB = normalsArr[vertIdxB];
            let existingNormC = normalsArr[vertIdxC];

            //The normal is a cross-product between AB and AC
            let normal = vertB.Minus(vertA).CrossProduct(vertC.Minus(vertA)).ResizeTo(1);
            
            //If an existing normal is found it will be averaged with the new one
            normalsArr[vertIdxA] = (existingNormA)? existingNormA.Plus(normal).ResizeTo(1) : normal;
            normalsArr[vertIdxB] = (existingNormB)? existingNormB.Plus(normal).ResizeTo(1) : normal;
            normalsArr[vertIdxC] = (existingNormC)? existingNormC.Plus(normal).ResizeTo(1) : normal;
        }
    }
    this.SetNormalVec       = function (newNormal,idx)
    {    //Sets the normal vector of a specific index in the normals array
        //Will not accept out of range indexes
        //It is still possible to populate the normals in tandem to populating the surface vertices.
        
        //Filter the arguments
        if(!(newNormal instanceof TypeXYZw)) {newNormal = new TypeXYZw(newNormal);}
        if(idx===void(0)) {idx=normalsArr.length;}
        idx = Number(idx);
    
        if(targetSurface===void(0)) {Say('WARNING: (SetNormalVec) Cannot set normal vector because no target surface has been assigned',-1); return;}
        if(Number.isNaN(idx) || idx<0 || idx>targetSurface.GetVertexCount()-1) {Say('WARNING: (SetNormalVec) Received invalid or out of range array index',-1); return;}

        //Set the normal vector
        normalsArr[idx] = newNormal; //if idx is larger then the length of the local normalsArr Javascript will automatically expand the array
    }
    
    //Perform initialization
    Initialize(targetSrf);
}
//------------------------------------------------------------------------------------------
function TypeSurfaceTextureCoord(targetSrf)
{    //Holds surface texture coordinates for a TypeSurface. Same size as the object vertex array. Handles texture projections
    //Is kept separate from TypeSurface for instancing purposes (same surface geometry different texture coords, or no texture coords)
    
    //Private properties
    var targetSurface;
    var textureCoordsArr;    //Array holding UVs for each vertex in the targetSurface
    
    //Private methods
    var Initialize       = function (Srf)
    {
        if (!(Srf instanceof TypeSurface)) {Say('WARNING: (TypeSurfaceTextureCoord) Object instance did not receive a target surface.',-1); return;}
        targetSurface = Srf;
        textureCoordsArr = [];
    }
    
    //Public methods
    this.IsTargetSurface = function (otherSrf) {return (otherSrf === targetSurface)? true:false;}
    this.GetTarget       = function ()         {return targetSurface;}
    this.GetUVsCount     = function ()         {return textureCoordsArr.length;}
    this.GetUVatVertex   = function (idx)      {return textureCoordsArr[Number(idx)];}
    this.SetUVatVertex   = function (newCoord,idx)
    {    //assigns a texture coordinate vector to a vertex index
        //It is still possible to populate the texture coordinates in tandem to populating the surface vertices; assuming the surface vertex addition was done first.
        
        //Filter the arguments
        if(!(newCoord instanceof TypeXYZw)) {newCoord = new TypeXYZw(newCoord);}
        if(idx===void(0)) {idx=textureCoordsArr.length;}
        idx = Number(idx);

        if(!targetSurface) {Say('WARNING: (SetCoord) Cannot set texture coordinate because no target surface has been assigned',-1); return;}
        if(Number.isNaN(idx) || idx<0 || idx>targetSurface.GetVertexCount()-1) {Say('WARNING: (SetCoord) Received invalid or out of range array index',-1); return;}
        
        textureCoordsArr[idx] = newCoord; //if idx is larger then the length of the local textureCoordsArr Javascript will automatically expand the array
    }
    this.ProjectPlanar   = function (bottomLeftP, bottomRightP, topLeftP, tMatrix)
    {    //Generate texture coordinates by planar projection. (bottomLeft is 00, topLeft is 01, topRight is 11)
        if (!targetSurface) {Say('WARNING: (ProjectPlanar) Cannot generate texture coordinates because no target surface has been assigned',-1); return;}
        if (!(bottomLeftP  instanceof TypeXYZw)) {bottomLeftP  = new TypeXYZw(bottomLeftP);}
        if (!(bottomRightP instanceof TypeXYZw)) {bottomRightP = new TypeXYZw(bottomRightP);}
        if (!(topLeftP     instanceof TypeXYZw)) {topLeftP     = new TypeXYZw(topLeftP);} 
        if (bottomLeftP.IsEqual(bottomRightP) || topLeftP.IsCollinear(bottomLeftP,bottomRightP)) {Say('WARNING: (ProjectPlanar) Cannot generate projection. Source points did not define a plane',-1); return;}
        
        var usetMatrix = (tMatrix instanceof TypeTmatrix) ? true:false;
        var vertCount  = targetSurface.GetVertexCount(); if (vertCount<1) {Say('WARNING: (ProjectPlanar) Cannot generate texture coordinates. Target surface has no vertices.',-1); return;}
        var vecB       = bottomRightP.Minus(bottomLeftP);             //projection plane width
        var vecC       = topLeftP.Minus(bottomLeftP).AsOrthoTo(vecB); //projection plane height. (Ensure perpendicular to vecB)
        var lenB       = vecB.Length();
        var lenC       = vecC.Length();

        for (let vertexIdx = 0; vertexIdx<vertCount;vertexIdx++)
        {
            let oneVertex = (usetMatrix)? tMatrix.MultiplyWith(targetSurface.GetVertex(vertexIdx)) : targetSurface.GetVertex(vertexIdx);
        
            //Could have used ProjectONTOpln, but that would cause double calculations since we need the components vecU and vecV that are computed internally in the TypeXYZw method. 
            let vecU = oneVertex.Minus(bottomLeftP).ProjectONTOvec(vecB); 
            let vecV = oneVertex.Minus(bottomLeftP).ProjectONTOvec(vecC);
            let U    = vecU.Length()/lenB; if (vecU.AngleTO(vecB) >pi/2) {U=-U};
            let V    = vecV.Length()/lenC; if (vecV.AngleTO(vecC) >pi/2) {V=-V};
            textureCoordsArr[vertexIdx] = new TypeXYZw(U,V);
        }
    }
    
    //Perform initialization
    Initialize(targetSrf);
}
//------------------------------------------------------------------------------------------
function TypeLegacyMaterial(syncAlpha)
{    //This is a material compatible to the OBJ standard.
    //Handles properties of how physical light interacts with an object
    
    //Note: TypeColor (R,G,B,A, (optional)clipTo, (optional)resizeTo)

    //Private properties
    var keepAlphaInSync = (syncAlpha==true);   //Boolean. Keep the alpha values of all colors syncronized to the 'd' value
    
    var ka = new TypeColor(0.5,0.5,0.5,1.0,1); //specifies the ambient reflectivity (lightness)
    var kd = new TypeColor(0.5,0.5,0.5,1.0,1); //Diffuse color (hue)
    var ks = new TypeColor(1.0,1.0,1.0,1.0,1); //specifies the specular reflectivity using RGB values
    var tf = new TypeColor(0.0,0.0,0.0,1.0,1); //Transmission filter (Tf 0 1 0 allows all the green to pass through and filters out  all the red and blue).
    var d  = 1.0;   //Transparency (1.0 is opaque)
    var ns = 0;     //This defines the focus of the specular highlight. (range 0-1000)
    var texture;    //Reference to a texture object
        
    //Public Properties
    this.name;    //User can set this to whatever they want
    
    //Public methods
    this.SetKa         = function (R,G,B,A,p)  {ka.SetColor(R,G,B,A,(p===void(0) || p==true)? 1:255); if (keepAlphaInSync){d=ka.GetA(); kd.SetA(d); ks.SetA(d); tf.SetA(d);} }
    this.SetKd         = function (R,G,B,A,p)  {kd.SetColor(R,G,B,A,(p===void(0) || p==true)? 1:255); if (keepAlphaInSync){d=kd.GetA(); ka.SetA(d); ks.SetA(d); tf.SetA(d);} }
    this.SetKs         = function (R,G,B,A,p)  {ks.SetColor(R,G,B,A,(p===void(0) || p==true)? 1:255); if (keepAlphaInSync){d=ks.GetA(); ka.SetA(d); kd.SetA(d); tf.SetA(d);} }
    this.SetTf         = function (R,G,B,A,p)  {tf.SetColor(R,G,B,A,(p===void(0) || p==true)? 1:255); if (keepAlphaInSync){d=tf.GetA(); ka.SetA(d); kd.SetA(d); ks.SetA(d);} }
    this.Setd          = function (newd)       {d  = ClipValue(newd); if (keepAlphaInSync){ka.SetA(d); kd.SetA(d); ks.SetA(d); tf.SetA(d);}} 
    this.SetNs         = function (newNs)      {ns = ClipValue(newNs,1000);} //Clips to 1000-0 range
    this.SetColor      = function (R,G,B,A,p)  {this.SetKd(R,G,B,A,p);}      //Shortcut directly to the diffuse color
    this.SetTexture    = function (newTxtr)    {if (newTxtr instanceof TypeImage || newTxtr === void(0)) {texture = newTxtr;} else {Say('WARNING: (SetTexture) Did not receive a valid image object',-1);} }
    this.IsLinkedAlpha = function (state)      {keepAlphaInSync = (state==true);}
    
    //Caution: 
    //Setting colors via Set methods defaults to the 0-1 range when 'p' is omitted
    //Setting colors via getting the color objects themselves and setting their color directly defaults to 0-255 range when 'p' is omitted
    
    this.GetKa         = function () {return ka;}
    this.GetKd         = function () {return kd;}
    this.GetKs         = function () {return ks;}
    this.GetTf         = function () {return tf;}
    this.GetColor      = function () {return kd;} //Shortcut directly to the diffuse color
    this.Getd          = function () {return d;}
    this.GetNs         = function () {return ns;}
    this.GetTexture    = function () {return texture;}
    
    this.toString      = function ()
    {
        var result = '[Object TypeLegacyMaterial] \n';
        result    += 'keepAlphaInSync = '+keepAlphaInSync+'\n';
        result    += 'ka = '+ka+'\n';
        result    += 'kd = '+kd+'\n';
        result    += 'ks = '+ks+'\n';
        result    += 'tf = '+tf+'\n';
        result    += ' d = '+d+'\n';
        result    += 'ns = '+ns+'\n';
        result    += 'texture = '+texture+'\n';
        result    += 'name = '+this.name+'\n';
        return result;
    }
}
//------------------------------------------------------------------------------------------
function TypeSceneObjectAppearance (isMasterLevel)
{   //Defines the 'look' of a scene object

    //Note: This appearance object represents *choices* of whether to reveal something about surfaces (or curves) or not
    //Note: This object also provides fall-back (defaults) for the all the pieces in the scene object

    //PRIVATE properties------   
    var isMaster;            //Boolean. This appearance object is the end of the line (all properties must have a default value. No void(0) allowed)
    var isVisible;           //Boolean. Turns an object on or off without having to change transparency values in the material
    var respondsToLight;     //Boolean. if false, the object doesn't interact with light sources in a physical way, it is always vibrant (illustrationMode)
    var showFullColor;       //Boolean. Color mode versus monochrome
    var showWireframe;       //Boolean. Choose to reveal the wireframe of surfaces
    var seeThruWireframe;    //Boolean. Faces are seethru during wireframe mode
    var showEdges;           //Boolean. Choose to highlight the edges of surfaces

    var material;            //TypeLegacyMaterial. if any of TypeCurveProperties objects have no color, they borrow from material
    var wireProperties;      //TypeCurveProperties (defaults for wireframe appearance)
    var edgeProperties;      //TypeCurveProperties (defaults for surface edges appearance)
    var curveProperties;     //TypeCurveProperties (defaults for curve objects appearance)
    
    //PRIVATE properties
    var Initialize = function (isMaster)
    {
        if (!isMaster) {return;} //Nothing to do
        
        isMaster         = true;
        isVisible        = true;
        respondsToLight  = true;
        showFullColor    = true;
        showWireframe    = false;
        seeThruWireframe = true;
        showEdges        = false;
        
        material         = new TypeLegacyMaterial();
        wireProperties   = new TypeCurveProperties(void(0),[0.4,0.4,0.4,1.0,true],1);
        edgeProperties   = new TypeCurveProperties(void(0),[0.2,0.2,0.2,1.0,true],1); 
        curveProperties  = new TypeCurveProperties(void(0),[0.2,0.2,0.2,1.0,true],1); 
    }
    
    //PUBLIC methods----------
    this.SetIsVisible           = function (state)      {isVisible        = (state===void(0) && !isMaster)? void(0) : (state)? true : false; return this;}
    this.SetRespondsToLight     = function (state)      {respondsToLight  = (state===void(0) && !isMaster)? void(0) : (state)? true : false; return this;}
    this.SetShowWireframe       = function (state)      {showWireframe    = (state===void(0) && !isMaster)? void(0) : (state)? true : false; return this;}
    this.SetSeeThruWireframe    = function (state)      {seeThruWireframe = (state===void(0) && !isMaster)? void(0) : (state)? true : false; return this;}
    this.SetShowEdges           = function (state)      {showEdges        = (state===void(0) && !isMaster)? void(0) : (state)? true : false; return this;}
    this.SetShowFullColor       = function (state)      {showFullColor    = (state===void(0) && !isMaster)? void(0) : (state)? true : false; return this;}
    this.SetColor               = function (R,G,B,A,p)  {if (!material) {material=new TypeLegacyMaterial();} material.SetColor(R,G,B,A,p); return this;}
    this.SetWireProperties      = function (newProp)    {if ((newProp===void(0) && !isMaster) || newProp instanceof TypeCurveProperties) {wireProperties=newProp;} else {Say('WARNING: (SetWireProperties) Did not receive a TypeCurveProperties object',-1);}  return this;}
    this.SetEdgeProperties      = function (newProp)    {if ((newProp===void(0) && !isMaster) || newProp instanceof TypeCurveProperties) {edgeProperties=newProp;} else {Say('WARNING: (SetEdgeProperties) Did not receive a TypeCurveProperties object',-1);}  return this;}
    this.SetCurveProperties     = function (newProp)    {if ((newProp===void(0) && !isMaster) || newProp instanceof TypeCurveProperties) {curveProperties=newProp;} else {Say('WARNING: (SetCurveProperties) Did not receive a TypeCurveProperties object',-1);}  return this;}
    this.SetMaterial            = function (newMtl)     {if (( newMtl===void(0) && !isMaster) ||  newMtl instanceof TypeLegacyMaterial)  {material = newMtl;} else {Say('WARNING: (SetMaterial) Material received was not a TypeLegacyMaterial object',-1);}  return this;}
    
    this.GetShowFullColor       = function () {return showFullColor;}
    this.GetShowWireframe       = function () {return showWireframe;}
    this.GetSeeThruWireframe    = function () {return seeThruWireframe;}
    this.GetShowEdges           = function () {return showEdges;}
    this.GetMaterial            = function () {return material;}
    this.GetIsVisible           = function () {return isVisible;}
    this.GetRespondsToLight     = function () {return respondsToLight;}
    this.GetWireframeProperties = function () {return wireProperties;}
    this.GetEdgeProperties      = function () {return edgeProperties;}
    this.GetCurveProperties     = function () {return curveProperties;}
    this.GetWireframeColor      = function () {return (wireProperties)? wireProperties.GetColor() : void(0);}
    this.GetEdgeColor           = function () {return (edgeProperties)? edgeProperties.GetColor() : void(0);}
    this.GetCurveColor          = function () {return (curveProperties)? curveProperties.GetColor() : void(0);}
    this.GetColor               = function () {return (material)? material.GetColor() : void(0);}
    
    this.toString               = function ()
    {
        var result = '[object TypeSceneObjectAppearance] \n';
        result += 'isMaster='+isMaster+'\n';
        result += 'isVisible='+isVisible+'\n';
        result += 'isMaster='+isMaster+'\n';
        result += 'respondsToLight='+respondsToLight+'\n';
        result += '-----------------------------------\n';
        result += 'material='+material+'\n';
        result += '-----------------------------------\n';
        result += 'showFullColor='+showFullColor+'\n';
        result += 'showWireframe='+showWireframe+'\n';
        result += 'seeThruWireframe='+seeThruWireframe+'\n';
        result += 'showEdges='+showEdges+'\n';
        result += '-----------------------------------\n';
        result += 'wireProperties='+wireProperties+'\n';
        result += '-----------------------------------\n';
        result += 'edgeProperties='+edgeProperties+'\n';
        result += '-----------------------------------\n';
        result += 'curveProperties='+curveProperties+'\n';
        result += '-----------------------------------\n';
        return result;
    }
    
    //Initialization
    Initialize (isMasterLevel);
}
//------------------------------------------------------------------------------------------
function TypeSurfaceProperties (targetSrf, normalsRef, textureUVsRef)
{    //Holds property information for a single surface
    //Can link to normals or textureUVs from elsewhere
    
    //Note: The properties in this object are what's available to be shown
    //Note: This object is not concerned with the 'choices' of which properties to reveal or not.
    
    //PRIVATE properties
    var targetSurface;   //Mandatory link to a surface geometry object (otherwise properties have no meaning)
    
    var normalsObj;      //TypeSurfaceNormals object. (each surface *must* have surface normals or else it will not render on screen)
    var textureUVsObj;   //TypeSurfaceTextureCoord object. this defines the UV coordinates for whatever texture is in the material property. Textures can be any image but the UV coordinates are intimate to the surface vertices
    
    var material;        //optional: TypeLegacyMaterial object representing how the surface area interacts with light (this is where a texture object, if any, lives also)
    var wireProperties;  //optional: TypeCurveProperties object representing how the mesh wireframe looks
    var edgeProperties;  //optional: TypeCurveProperties object representing how the surface edges look
    
    //PRIVATE methods
    var Initialize    = function (Srf, nRef, tRef)
    {    
        if (!(Srf instanceof TypeSurface)) {Say('WARNING: (TypeSyrfaceProperties) Object instance did not receive a target surface.',-1); return;}
        
        targetSurface = Srf;
        ChangeNormals (nRef);
        ChangeUVs (tRef);
    }
    var ChangeNormals = function (newNormalsObj)
    {   //Expects a TypeSurfaceNormals object
        if (newNormalsObj===void(0)) {newNormalsObj = new TypeSurfaceNormals (targetSurface);} //sending void(0) causes a new (empty) normals object.
        if (!(newNormalsObj instanceof TypeSurfaceNormals)) {Say('WARNING: (ChangeNormals) Did not receive a valid TypeSurfaceNormals object',-1); return;}
        if (!newNormalsObj.IsTargetSurface(targetSurface)) {Say('WARNING: (ChangeNormals) Normals object received was not linked to the same target surface',-1); return;}
        //Do the change
        normalsObj = newNormalsObj;
    }
    var ChangeUVs = function (newUVsObj)
    {   //Expects a TypeSurfaceTextureCoord object 
        if (newUVsObj===void(0)) {newUVsObj = new TypeSurfaceTextureCoord(targetSurface);} //sending void(0) causes a new (empty) texture UVs object.
        if (!(newUVsObj instanceof TypeSurfaceTextureCoord)) {Say('WARNING: (ChangeUVs) Did not receive a valid TypeSurfaceTextureCoord object',-1); return;}
        if (!newUVsObj.IsTargetSurface(targetSurface)) {Say('WARNING: (ChangeUVs) The textureUVs object received was not linked to the same target surface',-1); return;}
        //Do the change
        textureUVsObj = newUVsObj;
    }
    var ChangeMaterial = function (newMtl)
    {   //newMtl is allowed to be void(0) essentially removing the material altogether
        if (newMtl!==void(0) && !(newMtl instanceof TypeLegacyMaterial)) {Say('WARNING: (SetMaterial) Did not receive a valid material object',-1); return;} 
        //Do the change
        material = newMtl; 
    }
    
    //PUBLIC methods
    this.GetTarget         = function ()         {return targetSurface;}
    this.GetTexture        = function ()         {if(material instanceof TypeLegacyMaterial) {return material.GetTexture();} else {return void(0);}}
    this.GetMaterial       = function ()         {return material;}
    this.GetNormals        = function ()         {return normalsObj;}
    this.GetTextureUVs     = function ()         {return textureUVsObj;}
    this.GetWireProperties = function ()         {return wireProperties;}
    this.GetEdgeProperties = function ()         {return edgeProperties;}
    this.GetWireframeColor = function ()         {return (wireProperties && wireProperties.GetColor()      )? wireProperties.GetColor()       : void(0);}
    this.GetWireThickness  = function ()         {return (wireProperties && wireProperties.GetThickness()  )? wireProperties.GetThickness()   : void(0);}
    this.GetWireDash       = function ()         {return (wireProperties && wireProperties.GetDashPattern())? wireProperties.GetDashPattern() : void(0);}
    this.GetEdgeColor      = function ()         {return (edgeProperties && edgeProperties.GetColor()      )? edgeProperties.GetColor()       : void(0);}
    this.GetEdgeThickness  = function ()         {return (edgeProperties && edgeProperties.GetThickness()  )? edgeProperties.GetThickness()   : void(0);}
    this.GetEdgeDash       = function ()         {return (edgeProperties && edgeProperties.GetDashPattern())? edgeProperties.GetDashPattern() : void(0);}
    this.GetColor          = function ()         {return (material)? material.GetColor() : void(0);}
    
    this.GenerateNormals   = function ()         {normalsObj.GenerateNormals();}
    this.SetWireProperties = function (newProp)  {if (newProp===void(0) || newProp instanceof TypeCurveProperties) {wireProperties=newProp;} else {Say('WARNING: (SetWireProperties) Did not receive a TypeCurveProperties object',-1);} }
    this.SetEdgeProperties = function (newProp)  {if (newProp===void(0) || newProp instanceof TypeCurveProperties) {edgeProperties=newProp;} else {Say('WARNING: (SetEdgeProperties) Did not receive a TypeCurveProperties object',-1);} }
    this.SetMaterial       = function (newMtl)   {ChangeMaterial(newMtl);}
    this.SetTextureUVs     = function (newUVs)   {ChangeUVs(newUVs);}
    this.SetNormals        = function (newNorms) {ChangeNormals(newNorms);}
    
    this.ProjectPlanar     = function (bLeft,bRight,tLeft,newMaterial,tMatrix)
    {
        if (!(bLeft instanceof TypeXYZw) || !(bRight instanceof TypeXYZw) || !(tLeft instanceof TypeXYZw)) {Say('WARNING: (ProjectPlanarUVs) Did not receive valid projection plane coordinates',-1); return;}
        
        if(newMaterial!==void(0) && newMaterial instanceof TypeLegacyMaterial) {material = newMaterial;} //Interpret void(0) as leave it alone (otherwise void(0) would delete the existing material)
        textureUVsObj.ProjectPlanar(bLeft,bRight,tLeft,tMatrix);
    }
    
    Initialize (targetSrf, normalsRef, textureUVsRef);
}
//------------------------------------------------------------------------------------------
function TypeCurveProperties (targetCrv,crvColor, crvThickness, crvDashPattern)
{   //Holds property information for a curve object 

    //PRIVATE properties
    var targetCurve;   //For curves target is optional
    
    //Note: It is tempting to include fill-color in these properties (like in illustration programs) -->
    //  --> however a fill-color property would make sense only as a fill area bound by planar curves 
    //  --> and being an area it crosses into the territory of planar surfaces
    
    var color;         //A TypeColor object.
    var thickness;     //Numeric
    var dashPattern;   //[solid,gap,solid,gap...] an array of values representing alternating lengths of solid or gap sections. [10,5] means a repeating pattern of dash of 10 units long and a gap of 5 units long.
    
    //PRIVATE methods
    var Initialize       = function (tCrv, newColor, newThickness, newDashPattern)
    {
        if (tCrv===void(0) || tCrv instanceof TypeCurve) {targetCurve = tCrv} else {Say('WARNING: (TypeCurveProperties) Did not receive a TypeCurve object as target',-1); return;}
        
        ChangeColor (newColor);
        ChangeThickness (newThickness);
        ChangeDashPattern (newDashPattern);
    }
    var ChangeColor      = function (newColor)
    {
        //Accepts TypeColor or TypeLegacyMaterial. Will only read the diffuse color of TypeLegacyMaterial.
        //For anything else create a new local TypeColor object
        
        if(newColor===void(0)) {color=void(0); return;}
        if(newColor instanceof TypeColor) {color = newColor; return;}
        if(newColor instanceof TypeLegacyMaterial) {color = TypeLegacyMaterial.GetColor(); return;}
        
        color = new TypeColor (newColor);
    }
    var ChangeThickness   = function (newThickness)
    {
        if(newThickness===void(0)) {thickness=void(0); return;}
        newThickness = Number(newThickness);
        if (Number.isNaN(newThickness) || newThickness<0) {Say('WARNING: (SetThickness) Did not receive a valid thickness number <'+newThickness+'>',-1); return;}
        //Set thickness
        thickness = newThickness; 
    }
    var ChangeDashPattern = function (newDashPattern)
    {
        if(newDashPattern===void(0)) {dashPattern=void(0); return;}
        if(!IsArray(newDashPattern)) {Say('WARNING: (SetDashPattern) Did not receive an array',-1); return;}
        
        var patternLength = newDashPattern.length;
        for (let i = 0; i<patternLength-1;i++) {newDashPattern[i]=Number(newDashPattern[i]); if (newDashPattern[i]==NaN) {Say('WARNING: (SetDashPattern) Did not receive a numeric array',-1); return;} }
        //Set dashPattern
        dashPattern = newDashPattern;
    }
    
    //PUBLIC methods
    this.GetTarget        = function () {return targetCurve;}
    this.GetColor         = function () {return color;}
    this.GetThickness     = function () {return thickness;}
    this.GetDashPattern   = function () {return dashPattern;}
    
    this.SetColor         = function (newColor)       {ChangeColor(newColor);}
    this.SetFillColor     = function (newColor)       {ChangeFillColor(newColor);}
    this.SetThickness     = function (newThickness)   {ChangeThickness(newThickness);}
    this.SetDashPattern   = function (newDashPattern) {ChangeDashPattern(newDashPattern);}
    
    Initialize (targetCrv, crvColor, crvThickness, crvDashPattern);
}
//------------------------------------------------------------------------------------------
function TypeTextProperties ()
{
    //To DO ....
}
//------------------------------------------------------------------------------------------
function TypePointLight()
{   //
    
    //PRIVATE properties
    var isActive   = true;
    var isRelToCam = true;
    var intensity  = 100.0;
    var color      = new TypeColor(1.0,1.0,1.0,1.0,1.0);
    var position   = new TypeXYZw(-3.0,3.0,0.0);
    
    //PUBLIC Properties
    this.name;
    
    //PUBLIC methods
    this.GetIsActive        = function () {return isActive;}
    this.GetIsRelativeToCam = function () {return isRelToCam;}
    this.GetIntensity       = function () {return intensity;}
    this.GetColor           = function () {return color;}
    this.GetPosition        = function () {return position;}
    
    this.SetActive          = function (newState)  {isActive = (newState)? true : false;}
    this.SetIsRelativeToCam = function (newState)  {isRelToCam = (newState)? true : false;}
    this.SetIntensity       = function (newValue)  {intensity = ClipValue(newValue,Infinity);}
    this.SetColor           = function (newColor)  {if(newColor instanceof TypeColor) {color=newColor;} else {color=new TypeColor(newColor);} }
    this.SetPosition        = function (newPos)    {if(newPos instanceof TypeXYZw) {position=newPos;} else {position=new TypeXYZw(newPos);} }

    this.toString           = function ()
    {
        var result = '[Object TypePointLight]\n';
        result    += 'isActive   = '+isActive+'\n';
        result    += 'isRelToCam = '+isRelToCam+'\n';
        result    += 'intensity  = '+intensity+'\n';
        result    += 'color      = '+color+'\n';
        result    += 'position   = '+position+'\n';
        result    += 'name       = '+this.name+'\n';
        return result;
    }
}
//------------------------------------------------------------------------------------------
function TypeSceneObject(fromParent)
{    //Holds a scene object. 
    //A scene object has a single transformation matrix that acts on raw vertices. (conceptually different than a "group" whose main matrix would be acting on its member's matrices)
    //A scene object can be a single piece, but could also be a composit of many pieces such as surfaces (eg: a cube has 6 surfaces) and other primitives (such as lines, or curves), but all act as one entity.
    //A scene object pairs geometry with properties
    //A scene object can have children objects linking to the same geometry, but having different materials.
    //Does not draw anything on the screen (it is all theoretical)
    
    //PRIVATE properties -------------
    var parentObject;            //If not empty, the current object has its geometry (piece array) linking to a parent object
    
    //These two arrays are separated to fascilitate children objects linking to the parent object geometry, but having their own properties array.
    var pieceArr           = []; //A heterogeneous array of curve and/or surface objects; holding all the pieces of the current screen object. For example this could hold a grid of lines or the six faces of a cube
    var propertiesForPiece = []; //Holds normals, UVs, and material. Each piece can hold an optional override material. (Otherwise it defaults to this.material)
    
    var defaultAppearance;       //TypeSceneObjectAppearance object (If the pieceProperties has no material, we fall back to this)
    var kinematics;              //Physical properties and velocities

    var content;             //A table of contents for the types of geometry stored in the pieceArr.
    var lastModified;            //Timestamp indicating when any *piece* or *piece property* in this object was modified (that would necessitate a buffer refresh, in contexts where buffers are used)
    //Note: Things that would require buffer changes -> vertex edits, normals edits, UVs edits, piece color edits (per vertex color buffer)

    //PUBLIC properties --------------
    this.name;                   //Anything goes here, don't care
    
    //PRIVATE methods ----------------
    var Initialize = function (parentObj)
    {
        if (parentObj && parentObj.GetParent()) {Say('WARNING (TypeSceneObject) Deep instancing not allowed. Parent object received was itself a child of another object.',-1); parentObj = void(0);}
        if (parentObj===void(0) || parentObj instanceof TypeSceneObject) {parentObject = parentObj;} else {Say('WARNING: (TypeSceneObject) Did not receive a valid parent object of TypeSceneObject',-1);}
        
        defaultAppearance = new TypeSceneObjectAppearance();
        kinematics        = new TypeKinematics ();
        content           = 
        {
            curves      :false,             //has curve objects
            surfaces    :{hasOpen:false},   //if open surfaces, culling (when possible) will be turned off while rendering  
            texts       :false,             //has text objects
            plane       :new TypePlane(),   //whether the entire object (all pieces combined) is planar. This would the plane definition.
            centroid    :void(0),           //TypeXYZw point
            boundingBox :{                  //World axis aligned
                pointMin:void(0),
                pointMax:void(0)}
        };
        
        lastModified = Date.now();
    }
    var CheckPlanar           = function (query) 
    {   //receives a piece object (text, curve, or surface) and compares its plane to the sceneObject's common plane
        //if query is empty then all pieces are checked from scratch
        //Assume this method is never called from child objects (the pieceArr will typically have something in it)
        
        //Pre-check
        if (content.plane.IsFailed()) {return;} //Planarity permanently failed on this sceneObject
        if (query instanceof TypeSurface || query instanceof TypeCurve || query instanceof TypeText) {return content.plane.Has(query.GetPlane(),false);}
        
        var pieceCount = pieceArr.length;
        var startIdx   = (isNaN(query) || pieceCount-query<0)? 0 : pieceCount-query; 
        for (let i=startIdx; i<pieceCount; i++)
        {   //Walk through each piece in the pieceArr
            let piecePlane = pieceArr[i].GetPlane();
            
            //if any piece is non planar, the whole scenceObject is not planar
            if (!content.plane.CheckPlanar(piecePlane,false)) {return;}
        }
    }
    
    //PUBLIC methods -----------------

    this.SetHasTexts          = function (state) {content.texts            = (state)? true:false; return this;} //Note: Using double negation is *not* faster (content.texts = !!state;)
    this.SetHasCurves         = function (state) {content.curves           = (state)? true:false; return this;} 
    this.SetHasOpenSurfaces   = function (state) {content.surfaces.hasOpen = (state)? true:false; return this;}
    
    this.HasTexts             = function () {return content.texts;}
    this.HasCurves            = function () {return content.curves;} 
    this.HasOpenSurfaces      = function () {return content.surfaces.hasOpen;}
    
    this.IsChild              = function () {return (parentObject)? true : false;}
    this.IsPlanar             = function () {return content.plane.IsStarted();}
    this.GetZdepth            = function () {return content.plane.GetZdepth();}
    this.GetPlane             = function () {return content.plane;}
    this.GetLastModified      = function () {return lastModified;}
    this.GetParent            = function () {return parentObject;}
    this.GetDefaultAppearance = function () {return defaultAppearance;}
    this.GetDefaultMaterial   = function () {if (!defaultAppearance.GetMaterial() && parentObject) {return parentObject.GetDefaultMaterial();} else {return defaultAppearance.GetMaterial();} }
    this.GetKinematics        = function () {return kinematics;}
    this.GetPieceIdxByName    = function (lookupName)
    {
        //Technically we should return the object itself instead of its index.
        //In this case since the properties array is synchronized we DO need to know the index from the piece array to be able to relate to the piece properties array.
        if (parentObject) {return parentObject.GetPieceIdxByName(lookupName);}
        
        var pieceCount = pieceArr.length;
        for (let idx=0; idx<pieceCount; idx++) { if (pieceArr[idx].name == lookupName) {return idx;} }
        return void(0);
    }
    this.GetPiece = function (query,needIdx) 
    {
        if (parentObject) {return parentObject.GetPiece(query,needIdx);}
        
        if (IsString(query)) {query = this.GetPieceIdxByName(query);}
        if (query===void(0)) {query = pieceArr.length-1;} //The last piece in the array
        if (Number.isInteger (query)) {return (needIdx)? query : pieceArr[query];}
        
        Say('WARNING: (GetPiece) The requested piece <'+query+'> was not found',-1);
        return void(0);
    }
    this.GetPropertiesForPiece = function (query,needIdx)
    {
        //Returns a property object (including void), if this is a standalone object
        //Returns the parent object's property object, if this is a child object
        var totalPieces = this.GetPieceCount();
        if (totalPieces == 0 ) {return;}
        if (IsString(query)) {query = this.GetPieceIdxByName(query);}
        if (Number.isInteger (query)) {return (needIdx)? query : (propertiesForPiece[query]!==void(0) || !parentObject)? propertiesForPiece[query] : parentObject.GetPropertiesForPiece(query,needIdx);}
        
        Say('WARNING: (GetPropertiesForPiece) The requested piece <'+query+'> was not found. Not properties returned.',-1);
        return void(0);
    }
    this.GetMaterials  = function ()
    {
        var result = [];
        var propObjCount = propertiesForPiece.length;
        for (let i=0;i<propObjCount; i++)
        {
            //At this time only surfaces are assigned materials which are stored at the scene level
            if (propertiesForPiece[i]===void(0) || !(propertiesForPiece[i] instanceof TypeSurfaceProperties)) {continue;}
            let oneMaterial = propertiesForPiece[i].GetMaterial(); if (oneMaterial!==void(0)) {result.push(oneMaterial);}
        }
        return result;
    }
    this.GetPieceCount = function () {return (parentObject)? parentObject.GetPieceCount() : pieceArr.length;}
    this.GetPropCount  = function () {return propertiesForPiece.length;}
    this.AddPiece      = function (newPiece) 
    {
        if (parentObject) {Say('WARNING: (AddPiece) This is a child object linking to a parent and is not allowed to add a piece.',-1); return;}
        if (!(newPiece instanceof TypeSurface || newPiece instanceof TypeCurve)) {Say('WARNING: (AddPiece) Could not add SceneObject piece. Received neither a surface nor a curve object',-1); return;}
        
        pieceArr.push(newPiece); 
        lastModified = Date.now();
        
        CheckPlanar(newPiece);
        return pieceArr.length;
    }
    this.AddPropertiesForPiece = function (query) { return this.AddPieceProperties(void(0),query); } //An alias for AddPieceProperties without supplying an object
    this.AddPieceProperties    = function (newPieceProperties, query) 
    {   
        //This method always changes the native properties array. It never touches the parent object if there is one.
        var pieceCount = this.GetPieceCount(); //Using the method because child objects have an empty piece array (no native piece geometry)
        if (pieceCount < 1 ) {Say ('WARNING: (AddPieceProperties) Could not add properties. The pieces array is empty.',-1); return;}
        
        //Query could be a name. GetPiece searches once by name to return the index. 
        var targetPieceIdx = this.GetPiece(query,true); if (targetPieceIdx==void(0)) {return;}
        var targetPiece    = this.GetPiece(targetPieceIdx); //GetPiece for an index is instantaneous
        
        //If needed create a new empty properties object
        if (newPieceProperties === void(0) && targetPiece instanceof TypeSurface) {newPieceProperties = new TypeSurfaceProperties(targetPiece);} 
        else if (newPieceProperties === void(0) && targetPiece instanceof TypeCurve) {newPieceProperties = new TypeCurveProperties(targetPiece);}
        
        //In case the original argument contins an invalid object 
        if (!(newPieceProperties instanceof TypeSurfaceProperties || newPieceProperties instanceof TypeCurveProperties)) {Say('WARNING: (AddPieceProperties) Did not receive a valid properties object',-1); return;}
        
        //Note: piece properties still links to a piece in the parent object (if this is a child object)
        //Effectively (if this is a child object) we end up with a piece in the parent object potentially being linked multiple times accross many child objects
        if (newPieceProperties.GetTarget() != targetPiece) {Say('WARNING: (AddPieceProperties) The supplied properties object does not link/correspond to the piece at index ['+query+']',-1); return;}
        propertiesForPiece[targetPieceIdx] = newPieceProperties; //The array will expand automatically. Unlike in C++ you do not need to make sure the propertiesForPiece array is large enough.
     
        lastModified = Date.now();
        return newPieceProperties;
    }
    //Note: There is no SetKinematics method (not needed). With GetKinematics we can subsequently use the kinematics object's own set methods
    //Note: There is no SetParent method. Parenting only happens at initialization
    this.SetDefaultMaterial = function (newMtl)   {defaultAppearance.SetMaterial(newMtl); }
    this.SetAsModified      = function ()         {lastModified = Date.now();} //Allow client to set this manually. If a piece is obtained and the piece internal change the SceneObject wouldn't know
    
    //Methods for preset geometry
    this.AddGrid            = function (unitLength, unitCountX, subdivisions, color1, color2) 
    {
        //This method adds two pieces to this scene object
        //One piece is a curve object having vertices representing a line-pile for the major grid lines
        //The other piece is a curve object having vertices representing a line-pile for the minor grid lines
        //Each object naturally can have its own properties for color. So major and minor grid lines can be distinguished
        
        //unitLength is the *size* (not the number) of the major grid line spacing (1 cm, or 1m, etc)
        //unitCountX is how many units (spaces) the major grid has in the positive X direction
        //subdivisions is the number of spaces between major grid lines. (Two subdivisions means there will be one minor grid line in between major ones; subdividing the gap in two)
        
        if (parentObject) {Say('WARNING (AddGrid) This a child object. Not allowed to add geometry to a child object',-1); return;}
        
        var defaultMajorColor = new TypeColor(230,230,230,1,255,1);
        var defaultMinorColor = new TypeColor(248,248,248,1,255,1);
        
        //Check arguments and set defaults if necessary
        unitLength   = Number(unitLength);               if (unitLength===NaN || unitLength<0)   {unitLength=1;} 
        unitCountX   = Math.floor(Number(unitCountX));   if (unitCountX===NaN || unitCountX<1)   {unitCountX=1;}
        subdivisions = Math.floor(Number(subdivisions)); if (subdivisions===NaN || subdivisions<1) {subdivisions=1;}
        color1 = (color1===void(0))? defaultMajorColor : (!(color1 instanceof TypeColor))? new TypeColor(color1) : color1;
        color2 = (color2===void(0))? defaultMinorColor : (!(color2 instanceof TypeColor))? new TypeColor(color2) : color2;
                
        var totalGapCount = unitCountX*subdivisions*2; //Total number of spaces between grid lines (both in -x and +x direction)
        var minorGapLength = unitLength/subdivisions;  //Size of the minor grid line spacing
        var quadrantLength = unitLength*unitCountX;    //Length of an entire quadrant
                
        var majorGrid     = new TypeCurve(); pieceArr.push(majorGrid); //Create a piece and store it in the pieceArr
        var majorGridProp = new TypeCurveProperties(majorGrid, color1); propertiesForPiece[pieceArr.length-1] = majorGridProp; //The correspinding properties
        var minorGrid     = new TypeCurve(); pieceArr.push(minorGrid); //Create a piece and store it in the pieceArr
        var minorGridProp = new TypeCurveProperties(minorGrid, color2); propertiesForPiece[pieceArr.length-1] = minorGridProp; //The correspinding properties

        for (let i=0;i<=totalGapCount;i++)
        {
            let lineX = [new TypeXYZw(-quadrantLength,-quadrantLength+i*minorGapLength), new TypeXYZw(quadrantLength,-quadrantLength+i*minorGapLength)];
            let lineY = [new TypeXYZw(-quadrantLength+i*minorGapLength,-quadrantLength), new TypeXYZw(-quadrantLength+i*minorGapLength,quadrantLength)];
            
            //Add the lines to the appropriate curve object
            if (i%subdivisions == 0) {majorGrid.AddVertex(lineX[0]);majorGrid.AddVertex(lineX[1]);majorGrid.AddVertex(lineY[0]);majorGrid.AddVertex(lineY[1]);}
            else {minorGrid.AddVertex(lineX[0]);minorGrid.AddVertex(lineX[1]);minorGrid.AddVertex(lineY[0]);minorGrid.AddVertex(lineY[1]);}
        }
        
        majorGrid.SetAsLine(); CheckPlanar(majorGrid); 
        minorGrid.SetAsLine(); CheckPlanar(minorGrid);
        lastModified = Date.now();
    }
    this.ProjectPlanar = function (pieceQuery,bLeft,bRight,tLeft,newMaterial)
    {   //Changes the UVs for a piece by projecting a plane with 0,0 at bLeft

        var targetPieceIdx = this.GetPiece(pieceQuery,true); if (targetPieceIdx === void(0)) {return;}
        var targetPiece    = this.GetPiece(targetPieceIdx); if (!(targetPiece instanceof TypeSurface)) {Say('WARNING: (ProjectPlanarUVs) Piece <'+pieceQuery+'> is not a TypeSurface',-1); return;}
        
        if (propertiesForPiece[targetPieceIdx] === void(0)) {propertiesForPiece[targetPieceIdx] = new TypeSurfaceProperties(targetPiece);}
        propertiesForPiece[targetPieceIdx].ProjectPlanar (bLeft,bRight,tLeft,newMaterial,kinematics.GetTmatrix());
        lastModified = Date.now();
        
        return this;
    }
    this.EliminateVertexSharing = function ()
    {   //Will eliminate vertex sharing from all surface pieces in this sceneObject
        if (parentObject) {Say('WARNING: (EliminateVertexSharing) This is a child object linking to a parent and is not allowed to modify parent geometry.',-1); return;}
        
        var pieceCount = pieceArr.length;
        for (let i=0; i<pieceCount; i++)
        {
            let onePiece = pieceArr[i];
            if (!(onePiece instanceof TypeSurface)) {continue;}
            onePiece.EliminateVertexSharing();
            lastModified = Date.now();
        }
        return this;
    }
    this.toString = function ()
    {
        var result  = '[Object TypeSceneObject]\n';
            result += 'Name = '+this.name+'\n';
            result += '';
        return result;
    }

    //Initialization
    Initialize (fromParent);
}
//------------------------------------------------------------------------------------------
function TypeScene()
{    //This is an entire world.
    //Contains lights, cameras, materials, textures, screen objects.
    //Does not draw anything on the screen (it is still all theoretical)
    
    //Private properties
    var camera;                //A scene has one camera
    var lights    = [];        //An array of scene lights
    var objects   = [];        //An array of TypeSceneObject
    var materials = [];        //An array of TypeMaterial, or TypeLegacyMaterial
    var textures  = [];        //An array of TypeImage
    
    //Note: materials deal with how light physically interacts with an object.
    //Note: appearance contains a material, but also deals the graphical style of a sceneObject (visibility, curve properties, surface-edge properties, wireframe etc)
    //Note: setting visibility to false at the scene level essentially turns off the whole scene
    
    var ambientLight = {isActive:true, intensity:0.5, color:new TypeColor(1,1,1,1,1)};
    var defaultAppearance;  //Hardwired default appearance for all the scene objects (TypeSceneObjectAppearance)
    var lastModified;       //Object that keeps various timestamps
        
    //Private methods
    var Initialize   = function ()
    {
        camera    = new TypeCamera();
        lights[0] = new TypePointLight();
        
        defaultAppearance = new TypeSceneObjectAppearance(true); //The true options turns this into a master-appearance object where all it properties are filled with some tangible default value
        defaultAppearance.GetMaterial().name='<Hardwired Scene Default>';
        lastModified = 
        {
            objects  :Date.now(),  //geometry changes
            textures :Date.now(),  
            materials:Date.now(), 
            movement :Date.now()   //Something in the scene has moved (cameras, lights, or objects)
        };
    }
    var Lookup       = function (sourceArr,thisThing,asIndex)
    {   //Takes one of the source arrays and looks up an object in it. Will return the object itself or its index if asIndex==true
        
        var lookupByName = true;
        var isTexture    = (sourceArr==textures)? true : false; //if texture we also check the filename along with the name
        var arrLen       = sourceArr.length;
        
        if (thisThing===void(0) || arrLen==0) {return;} //Nothing to do
        if (Number.isInteger(thisThing)) {return sourceArr[thisThing];} //return object by index (out of bound indexes return void(0) )
        if (sourceArr==lights    && (thisThing instanceof TypePointLight)     || 
            sourceArr==objects   && (thisThing instanceof TypeSceneObject)    ||
            sourceArr==materials && (thisThing instanceof TypeLegacyMaterial) ||
            sourceArr==textures  && (thisThing instanceof TypeImage) ) {lookupByName=false;} //'thisThing' is a recognizable object of the same type as the source array contents
            
        //thisThing contains something for sure, so we can now search the array
        for (let idx=0; idx<arrLen; idx++) 
        { 
            if (!lookupByName && (sourceArr[idx]==thisThing || thisThing.name!=void(0) && (sourceArr[idx].name==thisThing.name || isTexture && sourceArr[idx].GetFileName()==thisThing.GetFileName()) ) || 
                 lookupByName && (sourceArr[idx].name==thisThing || isTexture && sourceArr[idx].GetFileName()==thisThing) ) {return (asIndex)? idx : sourceArr[idx];} 
        }
    
        //Nothing found
        return void(0);
    }
    
    //Public methods
    this.AddMaterial = function (newMtl) 
    {
        //This method first looks for the material *name* in the array. If it finds a material with the same name nothing happens, but the found material is returned. 
        //newMtl either has a TypeLegacyMaterial object or nothing at all
        if (newMtl === void(0)) {newMtl = new TypeLegacyMaterial();} //create a new material from scratch
        else if (!(newMtl instanceof TypeLegacyMaterial)) { Say('WARNING: (AddMaterial) Could not add material because the argument passed was not understood',-1); return; }
            
        var result = this.GetMaterial(newMtl.name); //Try to find the material among existing ones
        if (!result) {result = newMtl; materials.push(newMtl); lastModified.materials=Date.now();} //add if not found
        
        //Handle the texture of the material
        if (result.GetTexture() instanceof TypeImage) {this.AddTexture(result.GetTexture());}
        
        //The return value is only meaningfull when AddMaterial() is called without arguments and a new empty material is created. 
        //Getting a reference to the newly created material (within this method) is useful. Any other time the value of 'result' is already known to begin with
        return result;
    }
    this.AddTexture = function (newTexture)
    {
        var isImageArg = (newTexture instanceof TypeImage)? true : false;
        if (newTexture==void(0) || (!IsString(newTexture) && !isImageArg) ) {newTexture = new TypeImage(); isImageArg=true;}
        
        var result = this.GetTexture (newTexture); //Try to find it in the array if possible
        if (!result) {result = (isImageArg)? newTexture : new TypeImage(newTexture); textures.push(result); lastModified.textures=Date.now();}
        
        return result;
    }
    this.AddLight  = function (newLight)
    {
        if (newLight===void(0)) {newLight = new TypePointLight();}
        else if (!(newLight instanceof TypePointLight)) {Say('WARNING (AddLight) Could not add new light. Argument was not understood',-1); return;}
        //Add the light
        lights.push(newLight);
        //Return the object just added (this way, if newly created above, we get its reference handle)
        return newLight;
    }
    this.AddObject = function (newObj)
    {
        if (newObj==void(0)) {newObj = new TypeSceneObject();}
        else if (!(newObj instanceof TypeSceneObject)) {Say('WARNING (AddObject) Could not add new object. Argument was not understood',-1); return;}
        //Add the object
        objects.push(newObj);
        lastModified.objects=Date.now();
        
        //Handle the object materials (log them in the materials array)
        let objMaterials = newObj.GetMaterials();
        let matCount = objMaterials.length;
        for (let i=0;i<matCount;i++) {this.AddMaterial(objMaterials[i]);} //this.AddMaterial() will also handle the texture log
        
        //Return the object just added (this way, if newly created above, we get its reference handle)
        return newObj;
    }
    this.AreTexturesStillLoading  = function ()          {var textureCount = textures.length; for (let i=0; i<textureCount; i++){ if (!textures[i].IsStillLoading()) {return false;} } return true; }
    this.GetCamera                = function ()          {return camera;}
    this.GetObjectCount           = function ()          {return objects.length;}
    this.GetTextureCount          = function ()          {return textures.length;}
    this.GetMaterialsCount        = function ()          {return materials.length;}
    this.GetLightsCount           = function ()          {return lights.length;}
    this.GetDefaultMaterial       = function ()          {return defaultAppearance.GetMaterial();}
    this.GetDefaultAppearance     = function ()          {return defaultAppearance;}
    this.GetAmbientLight          = function ()          {return ambientLight;}
    
    this.GetLight                 = function (query,asI) {return Lookup(lights,query,asI); }    //when (asI == true) returns the index instead of the object found
    this.GetSceneObject           = function (query,asI) {return Lookup(objects,query,asI); }
    this.GetMaterial              = function (query,asI) {return Lookup(materials,query,asI); }
    this.GetTexture               = function (query,asI) {return Lookup(textures,query,asI); }
    
    this.GetAnyLookLastModified   = function ()          {var l=(lastModified.textures>=lastModified.materials)? lastModified.textures : lastModified.materials; return (l>=lastModified.objects)? l : lastModified.objects;}
    this.GetTexturesLastModified  = function ()          {return lastModified.textures;}
    this.GetMaterialsLastModified = function ()          {return lastModified.materials;}
    this.GetObjectsLastModified   = function ()          {return lastModified.objects;}
    this.GetMovementLastModified  = function ()          {return lastModified.movement;}
    
    this.SetTexturesAsModified    = function ()          {lastModified.textures  = Date.now(); return this;}
    this.SetMaterialsAsModified   = function ()          {lastModified.materials = Date.now(); return this;}
    this.SetObjectsAsModified     = function ()          {lastModified.objects   = Date.now(); return this;}
    this.SetMovementAsModified    = function ()          {lastModified.movement  = Date.now(); return this;}
    this.SetCamera                = function (newCamera) {if (newCamera instanceof TypeCamera) {camera = newCamera; return this;} else Say('WARNING (SetCamera) Did not receive a camera object',-1);}
    
    //Initialization
    Initialize();
}
//------------------------------------------------------------------------------------------
function TypeFile (sourceFilePath)
{    //Loads a file from a given source directory
    //Caution: The file loading is asynchronous (which means loading needs to be inside an animation loop in order to detect when the file becomes ready)
    
    //Private properties
    var request  = new XMLHttpRequest ();    //request object
    var isReady  = false;
    var isFailed = false;
    var filePath;
    var fileData;                            //File contents are stored here as a string. (Strings can go up to 2^30 size)
    
    //Public properties
    this.name;

    //Private methods
    var Initialize   = function (fPath)    
    {
        if (!IsString(fPath)) {Say('WARNING: (TypeFile) Supplied path was either empty or not a string',-1); SetFailed(); return;}
        filePath = fPath;
        request.onreadystatechange = Receiver; //"Receiver" is a function (defined below). We sent the function itself (we don't call it)
        request.open ("GET", filePath);
        request.send ();
    }
    var Receiver     = function ()     
    {
        //The Receiver function itself is sent to request.onreadystatechange and will populate the fileData property whenever the file loads (asynchronously)
        //Once successful de-register this function from onreadystatechange
        if (request.readyState==4 && request.status==200) {SetReady(); fileData = request.responseText; request.onreadystatechange = null; return;}
        if (request.status==404) {SetFailed(); request.onreadystatechange = null; return;} //De-register
    } 
    var SetFailed       = function ()    {isReady=false; isFailed=true;}
    var SetReady        = function ()    {isReady=true; isFailed=false;}
    
    //Public methods
    this.IsLoaded       = function ()    {return isReady;}
    this.IsFailed       = function ()    {return isFailed;}
    this.IsStillLoading = function ()    {return !(isReady || isFailed);}
    this.GetFilePath    = function ()    {return filePath;}
    this.GetDataAsText  = function ()    {return fileData;}
    this.GetDataAsArray = function ()
    {    //Puts each line of the text data into an array and returns the array
        return (IsString(fileData))? fileData.split(/\r?\n/) : []; //Regular expression is between forward slashes /....../ It contains the operant \r (carriage return UNIX) and \n (new line). The ? means that \r may exist 0 or 1 times.
    }

    //Initialize object instance
    Initialize(sourceFilePath);
}
//------------------------------------------------------------------------------------------
function TypeImage (sourceFilePath)
{    //Loads an image from a given source directory

    //Private properties
    var imageObject;         //the actual image object
    var isReady  = false;    //if still loading -> false, if failed ->false
    var isFailed = false;    //if still loading -> false
    var fileName;
    var filePath;
    var lastModified;
    
    //Public properties
    this.name;               //Client can set this manually. By default it receives the filename.
    
    //Private methods
    var Initialize = function (fPath)
    {
        imageObject = new Image();
        imageObject.onload  = SetCompleted;
        imageObject.onerror = SetFailed;
        
        if (!IsString(fPath)) {return;} // No need to fail here because there is an option to set the path later
        filePath = fPath;
        imageObject.src = fPath;
    }
    var SetCompleted = function () {isReady = true; isFailed=false; fileName=GetPathComponents(imageObject.src).fileName; lastModified = Date.now(); if(!this.name) {this.name=fileName;} Say('NOTE: (TypeImage) Successfully loaded image <'+fileName+'>',-1);}
    var SetFailed     = function () {isReady = false; isFailed=true;Say('WARNING: (TypeImage) Failed to load image <'+GetPathComponents(imageObject.src).fileName+'>',-1);}
    
    //Public functions
    this.IsLoaded        = function ()  {return isReady;}
    this.IsFailed        = function ()  {return isFailed;}
    this.IsStillLoading  = function ()  {return !(isReady || isFailed);}
    this.GetFileName     = function ()  {return fileName;}
    this.GetFullPath     = function ()  {return imageObject.src;}
    this.GetPath         = function ()  {return filePath;}
    this.GetImageObj     = function ()  {return imageObject;}
    this.GetWidth        = function ()  {return imageObject.width;}
    this.GetHeight       = function ()  {return imageObject.height;}
    this.GetAspectRatio  = function ()  {return imageObject.width / imageObject.height;}
    this.GetLastModified = function ()  {return lastModified;}
    this.SetPath         = function (newPath,preserveName)     
    {
        if (!IsString(newPath)) {Say('WARNING: (SetPath) Supplied path was either empty or not a string',-1); return;}
        if (!preserveName) {this.name=void(0);} //clears the name variable so that it will receive the new filename upon completion of loading
        filePath = newPath;
        imageObject.src = newPath;
    }
    
    //Initialization
    Initialize (sourceFilePath);
}
//------------------------------------------------------------------------------------------
function TypeOBJFileLoader (sourceFilePath)
{    //This object reads an obj file from a path and generates objects, materials, and textures into a scene
    //This could be a method inside the TypeScene object, but has been elevated to object status in order to provide internal mechanisms to handle asynchronous file loading 
    //The OBJ file is a three link chain. The main file provides a path linking to the materials file and the materials file provides links to texture files

    //PRIVATE variables ----------------------------------------
    //The following variables treat the raw obj as strings and store it in various ways (they don't understand the data)
    var mainOBJfile;            //TypeFile object. The text file
    var mainOBJFileLinesArr;    //The text file converted into an array of lines
    var mtlFile;                //TypeFile object. The text file
    var mtlFileLinesArr;        //The text file converted into an array of lines
    
    //The actual OBJ file data is stored in these arrays (teased out from the above variables).
    var sceneObjects = [];        //Array of TypeSurface
    var materials    = [];        //Array of TypeLegacyMaterial
    var textures     = [];        //Array of TypeImage
    
    var isReady   = false;
    var isFailed  = false;
    
    //PRIVATE methods
    var Initialize      = function (fPath)
    {
        if (!IsString(fPath))                 {Say('WARNING: (TypeOBJFileLoader) Was not supplied a path in string form',-1); isFailed=true; return;}
        
        //Now we can load the main OBJ file
        mainOBJfile  = new TypeFile (fPath);  //File is loading asynchronously
        LoadMtlFile();
    }
    //------------------
    var SetCompleted   = function () {isReady = true; isFailed=false; Say('NOTE: (TypeOBJFileLoader) Successfully loaded OBJ file <'+mainOBJfile.GetFilePath()+'>',-1);}
    var SetFailed      = function () {isReady = false; isFailed=true;Say('WARNING: (TypeOBJFileLoader) Failed to load OBJ file <'+mainOBJfile.GetFilePath()+'>',-1);}
    //------------------
    var GetLineParts   = function (strLine,isCommandCaseSensitive)
    {   //Takes a line from the OBJ file and splits it into a COMMAND portion and a DATA portion
        var result = {command:void(0),data:void(0),dataWords:void(0)};
        
        if (!IsString(strLine)) {strLine='';}
 
        var firstSpace   = strLine.indexOf (' ');

        result.command   = (firstSpace<0)? strLine : strLine.substring(0,firstSpace);
        result.data      = (firstSpace<0)? '' : strLine.substring(firstSpace+1);
        result.dataWords = result.data.split(' ');
    
        if (!isCommandCaseSensitive) {result.command = result.command.toLowerCase();}
    
        return result;    
    }
    //------------------
    var LookupMaterial = function (mtlName)
    {    //Returns a materials object if found in the array; otherwise returns 'undefined'
        var mtlCount = materials.length;
        //The mtlName lookup must be a string inside the OBJ loader
        if (!IsString(mtlName)) {Say('WARNING: (LookupMaterial) Did not receive a valid string as an argument',-1); return;}
        if (mtlCount==0) {return;} //Nothing to look into when the array is empty
        
        //Search the array
        //This is an expensive lookup (a better data structure might be needed if large populations are expected)
        for (var idx=0; idx<mtlCount; idx++) { if (materials[idx].name==mtlName) {return materials[idx];} }
        
        //Looked but nothing found
        return;
    }
    //------------------
    var AddMaterial    = function (newMtl)
    {
        //newMtl either has a TypeLegacyMaterial object or nothing at all
        if (newMtl === void(0)) {newMtl = new TypeLegacyMaterial();}    //create a new material from scratch
        else if (!(newMtl instanceof TypeLegacyMaterial)) { Say('WARNING: (AddMaterial) Could not add material because the argument passed was not understood',-1); return; }
            
        var result = LookupMaterial(newMtl.name);                            //Try to find the material among existing ones
        if (result === void(0)) {result = newMtl; materials.push(newMtl);}  //if not found, then add it to the array
        
        return result;
    }
    //------------------
    var LookupTexture  = function (imgName)
    {    //Returns an image object if found in the array; otherwise returns 'undefined' (Note: null == void(0) is true, but null === void(0) is false )
        var textureCount = textures.length;
        if (!IsString(imgName) || textureCount==0) {return void(0);}
        
        //Search the array
        //This is an expensive lookup (a better data structure might be needed if large populations are expected)
        for (var idx=0; idx<textureCount; idx++) { if (textures[idx].name == imgName || textures[idx].GetFileName() == imgName) {return textures[idx];} }

        //Nothing found
        return void(0);
    }
    //------------------
    var AddTexture     = function (sourcePath)
    {   //Receives the source path to an image file and returns an image object
        if (!IsString(sourcePath)) {Say('WARNING: (AddTexture) Could not add image file because no valid path was supplied',-1); return;}
        
        var result = LookupTexture (GetPathComponents(sourcePath).fileName);
        if (result === void(0)) {result = new TypeImage(sourcePath); textures.push(result);}
        
        return result;
    }
    //------------------
    // Load cascade (the following functions read the OBJ file in stages)
    // MainOBJfile --> materials --> textures --> sceneObjects
    var LoadMtlFile    = function ()
    {
        if (mainOBJfile.IsStillLoading()) {setTimeout(LoadMtlFile,500); return;} //mainOBJfile is still loading, wait.
        if (mainOBJfile.IsFailed()) {Say('WARNING: (TypeOBJFileLoader) Failed to load the main OBJ file',-1); SetFailed(); return;}
        
        mainOBJFileLinesArr = mainOBJfile.GetDataAsArray();
        
        //Find the mtllib line inside the main OBJ File. 
        //Walk through the lines of the OBJ file until the mtllib line and read the path (it should be the third line from the top)
        var mtlFilePath;    //Store the materials file path here
        var totalOBJlines = mainOBJFileLinesArr.length; if (totalOBJlines==0) {Say('WARNING: (LoadMtlFile) The OBJ file contained no data to parse',-1); SetFailed(); return;}
        var objLine;        //Stores a single line from the file
        for (var lineIdx=0; lineIdx<totalOBJlines; lineIdx++) {objLine = GetLineParts(mainOBJFileLinesArr[lineIdx]); if (objLine.command=='mtllib') {mtlFilePath = objLine.data; break;} }
        if (mtlFilePath === void(0)) {Say('WARNING: (LoadMtlFile) mtllib file path was not found in the OBJ file',-1); return;}
        
        //Use the found mtllib path to load the mtl file and then read it
        mtlFile = new TypeFile (mtlFilePath);  //Loading the file asynchronously
        ReadMtlFile();                           //Now try to read the file
    }
    //------------------
    var ReadMtlFile    = function ()
    {
        //Wait until the mtl file has loaded asynchronously
        if (mtlFile.IsStillLoading()) {setTimeout(ReadMtlFile,500); return;} //mtlFile is still loading, wait.
        if (mtlFile.IsFailed()) {Say('WARNING: (TypeOBJFileLoader) Failed to load the materials file',-1); SetFailed(); return;}
        
        //Get the text file as an array of lines
        mtlFileLinesArr   = mtlFile.GetDataAsArray(); //Converts the text file into an array of lines
        var totalMtlLines = mtlFileLinesArr.length; if (totalMtlLines==0) {Say('WARNING: (ReadMtlFile) The mtl file contained no data to parse',-1); SetFailed(); return;}
        
        //Go through all the lines in the materials file
        var currentMaterial;    //Temp object that holds material data read from the mtl file (it is then pushed into the scene and a new object is created to receive the next data).
        for (var lineIdx=0; lineIdx<totalMtlLines; lineIdx++)
        {    
            if (mtlFileLinesArr[lineIdx].startsWith('#') || mtlFileLinesArr[lineIdx].length==0) {continue;}    //Skip comments and empty lines (str.length==0). Carriage returns have been cleaned out by the split function

            //Split the line into two parts (the command part and the data part)
            var mtlLine = GetLineParts (mtlFileLinesArr[lineIdx]); //Private method above
            
            //Read the command and act
            if (mtlLine.command == 'newmtl') 
            {    
                currentMaterial = new TypeLegacyMaterial(true); //Start a new material
                currentMaterial.name = mtlLine.data;            //Set the material name
                AddMaterial(currentMaterial);                   //Instantiated and added to the array (its properties will be filled later)
                Say('NOTE: (ReadMtlFile) Loading material <'+currentMaterial.name+'>',-1);
                continue;
            }
            //The following act to modify properties of the currentMaterial
            if (mtlLine.command == 'ka')      {currentMaterial.SetKa(mtlLine.dataWords[0],mtlLine.dataWords[1],mtlLine.dataWords[2]); continue;}
            if (mtlLine.command == 'kd')      {currentMaterial.SetKd(mtlLine.dataWords[0],mtlLine.dataWords[1],mtlLine.dataWords[2]); continue;}
            if (mtlLine.command == 'ks')      {currentMaterial.SetKs(mtlLine.dataWords[0],mtlLine.dataWords[1],mtlLine.dataWords[2]); continue;}
            if (mtlLine.command == 'tf')      {currentMaterial.SetTf(mtlLine.dataWords[0],mtlLine.dataWords[1],mtlLine.dataWords[2]); continue;}
            if (mtlLine.command == 'd')       {currentMaterial.Setd(mtlLine.data); continue;}
            if (mtlLine.command == 'nf')      {currentMaterial.SetNf(mtlLine.data); continue;}
            if (mtlLine.command == 'map_kd')  {currentMaterial.SetTexture(AddTexture(mtlLine.data)); continue;}
        }
      
        //We are now ready to read the main OBJ file
        //(no need to wait for the textures to fully load)
        ReadOBJfile ();
    }
    //------------------
    var ReadOBJfile    = function ()
    {    //Go thru the OBJ file and start creating sceneObjects
        //Materials and textures have already been loaded into the arrays
         
        var currentSceneObject;        //Everything goes in here eventually (currentSurface and  currentSurfaceProperties)
        var currentSurface;              
        var currentSrfNormals;
        var currentSrfTextureUVs;
        var currentSurfaceProperties;  //Contains the currentSrfNormals and currentSrfTextureUVs
        var grouplessMode;             //While there are no groups encountered in the OBJ file, each surface is wrapped as its own SceneObject.
        var objFileVertexCounter=0;    //The total vertex counter (helps interpreting the indexes in the 'f' command of the OBJ file)
        
        var totalOBJlines = mainOBJFileLinesArr.length;
        for (var lineIdx=0; lineIdx<totalOBJlines; lineIdx++)
        {
            if (mainOBJFileLinesArr[lineIdx].startsWith('#') || mainOBJFileLinesArr[lineIdx].length==0) {continue;}    //Skip comments and empty lines (str.length==0)
                
            //Split the line into two parts (the command part and the data part)
            var objLine = GetLineParts (mainOBJFileLinesArr[lineIdx]);
            
            //Read the command and act
            //Note: do not try to check the command against a set of known commands. It adds unnecessary slowness (obj files can be a hundred thousand lines long or more)
            if (objLine.command == 'mtllib') {continue;} //This command has been completed earlier during material loading
            if (objLine.command == 'g' )
            {    //We want to treat OBJ groups as SceneObjects (this is our definition: scene objects are collections of surfaces that act as a unit)
                grouplessMode = false; //A group is being started inside the OBJ file, therefore we are no longer in groupless mode.
                if (currentSceneObject instanceof TypeSceneObject && currentSceneObject.name == objLine.data) {continue;} //go to next line (this object is going to be part of the same group as the previous one)

                //Make a new object
                currentSceneObject      = new TypeSceneObject(); //Start a new sceneObject
                currentSceneObject.name = objLine.data;             //Set the object name
                sceneObjects.push(currentSceneObject);             //Push it in the array
                Say('NOTE: (ReadOBJfile) Loading SceneObject <'+currentSceneObject.name+'>',-1);
                continue;
            }
            if (objLine.command == 'o' )
            {    //Assume the OBJ file (in our case coming from Rhino3D) only contains mesh objects (never curves). So 'o' means new surface object.
        
                if (grouplessMode != false) 
                {  
                    currentSceneObject = new TypeSceneObject();    //Start a new sceneObject (for groupless mode)
                    sceneObjects.push(currentSceneObject);        //Push it in the array
                    Say('NOTE: (ReadOBJfile) One orphan surface wrapped into a new sceneObject',-1);
                }
                
                //The surface and its properties that is about to be loaded
                currentSurface           = new TypeSurface();     //Start a new surface
                currentSurface.name      = objLine.data;          //Set the surface's name
                currentSrfNormals        = new TypeSurfaceNormals(currentSurface);
                currentSrfTextureUVs     = new TypeSurfaceTextureCoord(currentSurface);
                currentSurfaceProperties = new TypeSurfaceProperties (currentSurface,currentSrfNormals,currentSrfTextureUVs);
                //Add the above (currently empty objects) to the scene
                currentSceneObject.AddPiece (currentSurface);      //Pushes a piece to the end of the array and also creates an empty pieceProperties slot in the sister array.
                currentSceneObject.AddPieceProperties (currentSurfaceProperties); //Fills the empty pieceProperties slot from above
                continue;
            }
            //The remaining commands act on a surface object
            if (!(currentSurface instanceof TypeSurface)) {Say('WARNING (ReadOBJFile) Something is off. Encountered a command <'+objLine.command+'> but there is no surface object to act on',-1); continue;}
            if (objLine.command == 'usemtl' ) {currentSurfaceProperties.SetMaterial(LookupMaterial(objLine.data)); continue; }
            if (objLine.command == 'v' )
            {
                objFileVertexCounter++; //Advances the global counter for the entire file (there is no vertex 0 in OBJ files)
                currentSurface.AddVertex(objLine.dataWords); //currentSurface is just a reference and it is already inside currentSceneObject
                continue;
            }
            if (objLine.command == 'vt' )
            {
                currentSrfTextureUVs.SetUVatVertex (objLine.dataWords); //by omitting a vertex index it sets the UVs of the last vertex on the currentSurface
                continue;
            }
            if (objLine.command == 'vn' )
            {
                currentSrfNormals.SetNormalVec(objLine.dataWords); //by omitting a vertex index it sets the normal vec of the last vertex on the currentSurface
                continue;
            }
            if (objLine.command == 'f' )
            {
                var currentSrfOBJStartIdx = objFileVertexCounter - (currentSurface.GetVertexCount() - 1);
                var faceVertCount = objLine.dataWords.length;
                for (var i=0; i<faceVertCount;i++) {objLine.dataWords[i]=objLine.dataWords[i].split('/');} //In OBJ files v/vt/vn are triplets (eg f 4/4/4 3/3/3 1/1/1 2/2/2)
                //Obj files use global vertex count. We need to convert the global count to surface array index 
                //each surface stores its vertices from 0, but the obj file keeps counting accross surface objects
                //for example the line 'f 4332/4332/4332 4335/4335/4335 4334/4334/4334' refers to obj vertices 4332, 4334, 4335 but they could be actually 10,11,12 inside the currentSurface array
                var index1 = (faceVertCount < 1) ? void(0) : Number(objLine.dataWords[0][0]) - currentSrfOBJStartIdx;
                var index2 = (faceVertCount < 2) ? void(0) : Number(objLine.dataWords[1][0]) - currentSrfOBJStartIdx;
                var index3 = (faceVertCount < 3) ? void(0) : Number(objLine.dataWords[2][0]) - currentSrfOBJStartIdx;
                var index4 = (faceVertCount < 4) ? void(0) : Number(objLine.dataWords[3][0]) - currentSrfOBJStartIdx;
                currentSurface.AddMeshFace(index1, index2, index3, index4);
                continue;
            }
        } //End for loop
        Say('NOTE: (ReadOBJfile) Loaded '+sceneObjects.length+' sceneObjects',-1);
        CheckForImageCompleteness(); //Make sure all component images have been loaded
    }
    
    var CheckForImageCompleteness = function ()
    {
        //If any of the images are still loading wait and try again. 
        //Note: The test for "loading" involves two checks: if an image is not loaded, but is not failed either
        var textureCount = textures.length;
        for (var i=0; i<textureCount; i++) { if(textures[i].IsLoaded()==false && textures[i].IsFailed()==false) {setTimeout(CheckForImageCompleteness,1000); return;} }
        
        //All images are no longer loading (they either succeded or failed)
        //Even if some images failed, we call this OBJ file operation complete.
        SetCompleted();
    }
    
    //PUBLIC methods
    this.GetObjectCount  = function ()     {return sceneObjects.length;}
    this.GetObject       = function (idx)  {return sceneObjects[idx];}
    this.GetMaterial     = function (name) {return LookupMaterial(name);}
    this.IsLoaded        = function ()     {return isReady;}
    this.IsFailed        = function ()     {return isFailed;}
    this.IsStillLoading  = function ()     {return !(isReady || isFailed);}
    this.TransferObjects = function (targetScene)
    {
        let objCount = sceneObjects.length; //objects loaded from file and local to TypeOBJFileLoader
        if (objCount==0) {Say('WARNING: (TransferObjects) There were no objects to transfer (maybe this method was called too early)',-1); return;}
        if (targetScene===void(0) || !(targetScene instanceof TypeScene)) {Say('WARNING: (TransferObjects) Did not receive a valid target scene object)',-1); return;}
        
        //Walk through all loaded objects and add them to the target scene
        //Note: Materials and textures will be added automatically by thetargetScene.AddObject() method
        for (let i=0; i<objCount; i++) { targetScene.AddObject(sceneObjects[i]); }
        Say('NOTE: (TransferObjects) Transferred <'+objCount+'> objects',-1);
    }
    
    //Initialization
    Initialize (sourceFilePath);
}
//NOTE: It is possible to use __proto__ to create inherritance chains but at the current time it is not recommended for performance reasons (2017-6-27))