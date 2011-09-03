// The MIT License (MIT) <http://www.opensource.org/licenses/mit-license.php>

// Copyright (c) 2011 David J. Kleszyk

// Permission is hereby granted, free of charge, to any person 
// obtaining a copy of this software and associated documentation files 
// (the "Software"), to deal in the Software without restriction, 
// including without limitation the rights to use, copy, modify, merge, 
// publish, distribute, sublicense, and/or sell copies of the Software, 
// and to permit persons to whom the Software is furnished to do so, 
// subject to the following conditions:

// The above copyright notice and this permission notice shall be 
// included in all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, 
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF 
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND 
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS 
// BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN 
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN 
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN 
// THE SOFTWARE.

//namespace
var dssn = {};

//defaults
dssn.dflt = {
    'dwell'      : 5000,    //time between slide changes
    'ftl'        : true,    //first-to-last order?
    'new-slides' : [],      //new elements for dynamic creation
    'start'      : 1,       //first slide in sequence range [1,n]
    'delta-t'    : 10,       //animation timer increment
    'n-steps'    : 50,      //animation steps
    'direction'  : 'right', //what direction should slides move in?
    'autostart'  : true     //auto start on load?
};

//add class(element, class name)
dssn.ac = function(el,s){var r=new RegExp(' '+s+' ','g');el.className=(' '+el.className+' ').replace(r,'').trim()+' '+s;try{this.fq()}catch(e){}};

//remove class(element, class name)
dssn.rc = function(el,s){var r=new RegExp(' '+s+' ','g');el.className=(' '+el.className+' ').replace(r,'').trim();try{this.fq()}catch(e){}};

dssn.d = function(o,p){return typeof(o[p])!=='undefined'?o[p]:this.dflt[p]};

//move(direction, first element, not-direction, second element, original x, final x, current x, steps, delta-T
dssn.m = function(d,el1,nd,el2,x0,xf,x,i,t){
    var dx = (xf-x0)/i, nx = x + dx;
    //update positions
    try{
        el1.style[d] = nx + '%';
    }catch(e){}
    try{
        el2.style[nd] = (100-nx) + '%';
    }catch(e){}
    
    //if we haven't reached final destination, try again in delta-T
    if( (x0 < xf && nx < xf) || (x0 > xf && nx > xf) ) {
        setTimeout(function(){dssn.m(d,el1,nd,el2,x0,xf,nx,i,t)},t);
        
    //else, make sure we don't overshoot
    } else {
        try{
            el1.style[d] = xf + '%';
        }catch(e){}
        try{
            el2.style[nd] = (100-xf) + '%';
        }catch(e){}
        try{
            this.fq();
        }catch(e){}
    }
};

//Function queue
dssn.qq = [];
dssn.q = function(f,a){dssn.qq.push({'f':f,'a':a})};
dssn.fq = function(){
    if(this.qq.length>0){
        var f = this.qq[0].f, a = this.qq[0].a;
        this.qq = this.qq.slice(1);
        f.apply(this,a);
    }
};

//create slider(element id, options list)
function dss(g,o){

    var 
    dw = dssn.d(o,'dwell'), 
    ftl = dssn.d(o,'ftl'), 
    nwl = dssn.d(o,'new-slides'), 
    f = dssn.d(o,'start'), 
    dt = dssn.d(o,'delta-t'), 
    ns = dssn.d(o,'n-steps'), 
    r = dssn.d(o,'direction'), 
    as = dssn.d(o,'autostart'), 
    s = {},                              //slider object
    el = document.getElementById(g),     //dl element
    im = el.getElementsByTagName('IMG'), //images array
    b = el.getElementsByTagName('DT'),   //dt element array
    a = [],                              //dd element array
    d = document.createElement('DIV'),   //container div
    w,                                   //width of slider
    h,                                   //height of slider
    em,                                  //height of em
    p = document.createElement('A'),     //prev control link
    n = document.createElement('A'),     //next control link
    l,                                   //length variable
    i,                                   //index variable
    e;                                   //element variable

    //turn the start from [1,n] to [0,n-1]
    --f;
    
    //make sure element is actually a DL
    if(el.nodeName.toUpperCase()!=='DL') {
        return false;
    }
    
    l = im.length;
    for(i = 0; i < l; i++) {
        if(!im[i].complete) {
            setTimeout(function(){dss(g,o)},20);
            return;
        }
    }
    
    //get the current size the DL
    w = el.clientWidth;
    h = el.clientHeight;
        
    //create container around DL to position
    //controls in. set height of DL to 10em
    //to allow us to get the height of 1em
    //so that container size can be relative
    d.className = 'dss-c';
    el.parentNode.insertBefore(d,el);
    el.parentNode.removeChild(el);
    d.appendChild(el);
    
    //calculate height of 1em, 
    //then make sure that the 
    //DL is not positioned
    el.style.height = '10em';
    em = el.offsetHeight/10.0;
    el.style.position = 'static';
    
    //set the size of the container 
    //in relative units
    d.style.width = w/em + 'em';
    d.style.height = h/em + 'em';
    
    //create controls
    p.innerHTML = '&lsaquo;';
    p.className = 'dss-ctrl prev';
    p.title = 'Previous';
    p.onclick = function(){s.restart();s.slide(s.ndir(),true,false)};
    d.appendChild(p);
    
    n.innerHTML = '&rsaquo;';
    n.className = 'dss-ctrl next';
    n.title = 'Next';
    n.onclick = function(){s.restart();s.slide(s.dir(),true,true)};
    d.appendChild(n);
    
    //allow for dynamic creation of slides
    //this allows for pages with less 
    //initial http requests if there 
    //are images in the slides
    l = nwl.length;
    for(i=0;i<l;i++){
        var ndt = document.createElement('DT');
        var ndd = document.createElement('DD');
        ndt.innerHTML = nwl[i].content;
        ndd.innerHTML = nwl[i].caption;
        el.appendChild(ndt);
        el.appendChild(ndd);
        b[b.length] = ndt;
    }
    
    //read in the current slides
    l=b.length;
    for(i=0;i<l;i++){
        e = b[i];
        
        //hide any slides that aren't the start one
        dssn.rc(e,'on');
        if(i===f) {
            dssn.ac(e,'on');
        }
        
        //find the captions for the current slide
        a[i]=[];
        
        //we can have text nodes and DD's
        while( e.nextSibling && (
          e.nextSibling.nodeName.toLowerCase() === '#text' ||
          e.nextSibling.nodeName.toUpperCase() === 'DD'
          ) 
        ) {
            e = e.nextSibling;
            
            //skip over text nodes
            if(e.nodeName === '#text') {
                continue;
            }
            
            //hide any captions that aren't the start one
            dssn.rc(e,'on');
            if(i===f) {
                dssn.ac(e,'on');
            }
            
            //put the caption into the array
            a[i].push(e); 
        }
    }
    
    //valid directions for movement
    s.rs = ['top','right','bottom','left'];
    
    s.s=f;        //start slide
    s.c=f;        //current slide
    s.f=0;        //first slide
    s.l=--l;      //last slide, note this works because last set of l is to b.length
    s.t=b;        //content boxes
    s.d=a;        //caption boxes
    s.ftl=ftl;    //first-to-last
    s.n = ns;     //animation steps
    s.i = dt;     //animation timing
    s.w = dw;     //pause between slides
    s.r = r;      //default direction
    s.v = null;   //interval timer
    s.b = false;  //busy flag
    
    //slide(direction, ftl paramenter override, ftl value)
    s.slide = function(dir,ftld,ftl){
    
        var f,  //first-to-last
        ct,     //current slide
        cd,     //current caption
        nt,     //next slide
        nd,     //next caption
        ci,     //current index
        ni,     //next index
        i,      //animation timing
        n,      //animation steps
        di,     //direction index
        ndir,   //negative direction
        adir,   //adjacent direction
        odir;   //opposite direction

        //get some variables from our object
        i = this.i;
        n = this.n;
        f = this.ftl;

        //use the parameter for first-to-last if override is set
        if(ftld) {
            f = ftl;
        }

        ci = ni = this.c; //set both indices to current
        if(f){
            ni = (++ni>this.l?this.f:ni); //increment with wrap around if first-to-last
        } else {
            ni = (--ni<this.f?this.l:ni); //decrement with wrap around if last-to-first
        }
        
        ct = this.t[ci];    //get the current slide
        cd = this.d[ci][0]; //get the current caption not dealing with multiple captions yet
        nt = this.t[ni];    //get the next slide
        nd = this.d[ni][0]; //get the next caption
        
        //set up the direction indices
        di = this.rs.indexOf(dir);
        if(di<0) {
            return;
        } else {
            adir = this.rs[(di-1<0?di+3:di-1)];
            ndir = this.rs[(di-2<0?di+2:di-2)];
            odir = this.rs[(di-3<0?di+1:di-3)];
        }
        
        //position the current and next slides to where they need to be
        //at the start of the animation
        nt.style[ndir] = '-100%';
        ct.style[dir] = ct.style[adir] = nt.style[adir] = '0';
        ct.style[odir] = nt.style[odir] = ct.style[ndir] = nt.style[dir] =  '';
        
        //position the current and next captions to where they need to be 
        //at the start of the animation
        nd.style.top = '-100%';
        cd.style.top = cd.style.left = '0';
        cd.style.right = cd.style.bottom = nd.style.right = nd.style.bottom ='';
                
        //animation sequence goes like this
        // 1. unhide the next slide and caption
        // 2. move the current caption out of the way
        // 3. move the current and next slides into position
        // 4. move the next caption into position
        // 5. hide the current (now previous) slide and caption
        dssn.q(dssn.ac,[nt,'on']);
        dssn.q(dssn.ac,[nd,'on']);
        dssn.q(dssn.m,['top',cd,'',null,0,-100,0,n/2,i/2]);
        dssn.q(dssn.m,[dir,ct,ndir,nt,0,100,0,n,i/2]);
        dssn.q(dssn.m,['top',nd,'',null,-100,0,-100,n/2,i/2]);
        dssn.q(dssn.rc,[ct,'on']);
        dssn.q(dssn.rc,[cd,'on']);
        dssn.fq();
        
        //update the index to the next index
        this.c = ni;
    };
    
    //clears the interval
    s.stop = function() {
        clearInterval(this.v);
    };
    
    //starts the interval with delta-T of dwell time
    s.start = function() {
        var t,that = this;
        t = this.w;
        this.v = setInterval(function(){that.slide(that.dir())},t);
    };
    
    //reset the interval
    s.restart = function() {
        this.stop();
        this.start();
    };
    
    //returns the direction the slider is going in,
    //or a random direction
    s.dir = function() {
        var di = this.rs.indexOf(this.r);
        if(di >= 0) {
            return this.rs[di]
        } else {
            return this.rs[Math.floor(Math.random()*4)];
        }
    };
    
    //returns the not-direction the slider is going in,
    //or a random direction
    s.ndir = function() {
        var di = this.rs.indexOf(this.r);
        if(di >= 0) {
            return this.rs[(di-2<0?di+2:di-2)]
        } else {
            return this.rs[Math.floor(Math.random()*4)];
        }
    };
    
    //start if autostart enabled
    if(as) {
        s.start();
    }
    
    return s;
}
