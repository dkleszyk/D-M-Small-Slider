// The MIT License (MIT) <http://www.opensource.org/licenses/mit-license.php>

// Copyright (c) 2014 David J. Kleszyk

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
var dss = (function(module) {
    var defaults = {
        dwell        : 5000,    //time between slide changes
        ftl          : true,    //first-to-last order?
        'new-slides' : [],      //new elements for dynamic creation
        start        : 1,       //first slide in sequence range [1,n]
        duration     : 750,     //animation duration
        direction    : 'right', //what direction should slides move in?
        autostart    : true,    //auto start on load?
        tween        : function(t, b, c, d){return -c/2*(Math.cos(Math.PI*t/d)-1)+b;}
    }, removeClass = function(element, className) {
        var r = new RegExp(' '+className+' ','g');
        element.className = (' '+element.className+' ').replace(r,'').trim();
    }, addClass = function(element, className) {
        removeClass(element, className);
        element.className = (element.className + ' ' + className).trim();
    }, getDefault = function(options, key) {
        return typeof options !== 'undefined' && typeof options[key] !== 'undefined' ? options[key] : defaults[key];
    }, move = function(tween, firstDirection, firstElement, otherDirection, otherElement, originalPct, finalPct, duration, callback) {
        var start = null;
        function step(timestamp) {
            if(start === null) {
                start = timestamp;
            }
            var currentTime = timestamp - start,
                nextPct = tween.call(null, currentTime, originalPct, (finalPct-originalPct), duration);
            if(currentTime < duration) {
                if(firstElement) {
                    firstElement.style[firstDirection] = nextPct + '%';
                }
                if(otherElement) {
                    otherElement.style[otherDirection] = (100-nextPct) + '%';
                }
                window.requestAnimationFrame(step);
            } else {
                if(firstElement) {
                    firstElement.style[firstDirection] = finalPct;
                }
                if(otherElement) {
                    otherElement.style[otherDirection] = (100-finalPct) + '%';
                }
                if(callback) {
                    callback.call(null); 
                }
            }
        }
        window.requestAnimationFrame(step);
    };
    
    module.slider = function(elementId, options) {
        var s = {
                lock: false, 
                dwell: getDefault(options, 'dwell'), 
                currentSlide: getDefault(options, 'start')-1, //change from [1..n] to [0..n-1]
                duration: getDefault(options, 'duration'), 
                direction: getDefault(options, 'direction'), 
                firstToLast: 2*!!getDefault(options, 'ftl')-1, // change true/false to 1/-1
                tweenCb: getDefault(options, 'tween'),
                stop: function() {
                    clearInterval(this.intervalTimer); 
                },
                start: function() {
                    var t = this; 
                    t.intervalTimer = setInterval(function(){t.slide(t.dir());},t.dwell);
                },
                restart: function() {
                    this.stop();
                    this.start(); 
                }
            }, 
            autostart = getDefault(options, 'autostart'), 
            newSlides = getDefault(options, 'new-slides'), 
            dlElement = document.getElementById(elementId), 
            images = dlElement.getElementsByTagName('IMG'), 
            slides = dlElement.getElementsByTagName('DT'), 
            captions = [], 
            container = document.createElement('div'), 
            width = dlElement.clientWidth, 
            height = dlElement.clientHeight, 
            emHeight, 
            prev = document.createElement('A'),
            next = document.createElement('A'),
            l = images.length, 
            directions = ['top', 'right', 'bottom', 'left', 'random'], 
            i, temp;

        if(dlElement.nodeName.toUpperCase() !== 'DL'
            || (slides.length + newSlides.length) < 2
            || directions.indexOf(s.direction) < 0
        ) {
            if(window.console) {
                console.error("Unable to create slider: "+elementId);
            }
            return false;
        }

        //remove 'random' from actual list of directions
        directions.pop();

        //since we rely on knowing the image sizes, do not 
        //create slider if images have not loaded yet
        for(i=0; i<l; i++) {
            if(!images[i].complete) {
                return false;
            }
        }

        //create container around DL to position
        //controls in. set height of DL to 1000em
        //to allow us to get the height of 1em
        //so that container size can be relative
        container.className = 'dss-c';
        dlElement.parentNode.insertBefore(container, dlElement);
        dlElement.parentNode.removeChild(dlElement);
        container.appendChild(dlElement);

        //calculate height of 1em, 
        //then make sure that the 
        //DL is not positioned
        temp = dlElement.style.height;
        dlElement.style.height = '1000em';
        emHeight = dlElement.offsetHeight/1000.0;
        dlElement.style.position = 'static';
        dlElement.style.height = temp;

        //create controls
        prev.innerHTML = '&lsaquo;';
        prev.className = 'dss-ctrl prev';
        prev.title = 'Previous';
        prev.onclick = function(){s.restart();s.slide(s.ndir(),-1);};
        container.appendChild(prev);
        
        next.innerHTML = '&rsaquo;';
        next.className = 'dss-ctrl next';
        next.title = 'Next';
        next.onclick = function(){s.restart();s.slide(s.dir(),1);};
        container.appendChild(next);
        
        //allow for dynamic creation of slides
        //this allows for pages with less 
        //initial http requests if there 
        //are images in the slides
        l = newSlides.length;
        for(i=0; i<l; i++){
            temp = document.createElement('DT');
            temp.innerHTML = newSlides[i].content;
            dlElement.appendChild(temp);
            slides[slides.length] = temp;
            temp = document.createElement('DD');
            temp.innerHTML = newSlides[i].caption;
            dlElement.appendChild(temp);
        }
        
        //read in the current slides
        l = slides.length;
        for(i=0; i<l; i++){
            temp = slides[i];
            
            //hide any slides that aren't the start one
            removeClass(temp, 'on');
            if(i === s.currentSlide) {
                addClass(temp, 'on');
            }
            
            //find the captions for the current slide
            captions[i]=[];
            
            //we can have text nodes and DD's
            while( temp.nextSibling && (
                temp.nextSibling.nodeName.toLowerCase() === '#text' ||
                temp.nextSibling.nodeName.toUpperCase() === 'DD'
              ) 
            ) {
                temp = temp.nextSibling;
                
                //skip over text nodes
                if(temp.nodeName !== '#text') {
                    //hide any captions that aren't the start one
                    removeClass(temp, 'on');
                    if(i === s.currentSlide) {
                        addClass(temp, 'on');
                    }
                    
                    //put the caption into the array
                    captions[i].push(temp);
                }
            }
        }

        //set the size of the container 
        //in relative units
        container.style.width = (width/emHeight) + 'em';
        container.style.height = (height/emHeight) + 'em';

        //note that at this point 'l' is set to slides.length
        s.slide = function(direction) {
            if(this.lock) {
                return;
            }
            this.lock = true;
            var t = this, 
                args = arguments, 
                firstToLast = t.firstToLast * (args.length === 1 ? 1 : args[1]), 
                currentIndex = t.currentSlide, 
                currentSlide = slides[currentIndex], 
                currentCaption = captions[currentIndex][0], 
                nextIndex = currentIndex + firstToLast, 
                directionIndex = directions.indexOf(direction); 

            if(directionIndex < 0) {
                return;
            }

            if(nextIndex < 0) {nextIndex = (l-1);}
            if(nextIndex > (l-1)) {nextIndex = 0;}

            var nextSlide = slides[nextIndex],
                nextCaption = captions[nextIndex][0],
                
                adjacentDirection = directions[(directionIndex+3)%4],
                notDirection = directions[(directionIndex+2)%4],
                opposingDirection = directions[(directionIndex+1)%4];
                
            //position the current and next slides to where they need to be
            //at the start of the animation
            nextSlide.style[notDirection] = '-100%';
            currentSlide.style[direction] = currentSlide.style[adjacentDirection] = nextSlide.style[adjacentDirection] = '0';
            currentSlide.style[opposingDirection] = nextSlide.style[opposingDirection] = currentSlide.style[notDirection] = nextSlide.style[direction] =  '';
            
            //position the current and next captions to where they need to be 
            //at the start of the animation
            nextCaption.style.top = '0';
            currentCaption.style.top = currentCaption.style.left = nextCaption.style.left = '0';
            currentCaption.style.right = currentCaption.style.bottom = nextCaption.style.right = nextCaption.style.bottom ='';
            
            addClass(nextSlide, 'on');
            removeClass(currentCaption, 'on'); 
            move(t.tweenCb, direction, currentSlide, notDirection, nextSlide, 0, 100, t.duration, function() {
                    removeClass(currentSlide, 'on');
                    addClass(nextCaption, 'on');
                    t.currentSlide = nextIndex; 
                    t.lock = false; 
            });
        };
        
        //returns the direction the slider is going in,
        //or a random direction
        s.dir = function() {
            var t = this, directionIndex = directions.indexOf(t.direction);
            return ( directionIndex < 0 ? 
                directions[Math.floor(Math.random()*4)] : 
                t.direction
            );
        };

        //returns the not-direction the slider is going in,
        //or a random direction
        s.ndir = function() {
            var t = this, directionIndex = directions.indexOf(t.direction);
            return ( directionIndex < 0 ? 
                directions[Math.floor(Math.random()*4)] : 
                directions[(directionIndex+2)%4]
            );
        };
        
        if(autostart) {
            s.start(); 
        }

        return s; 
    };
    return module;

}(dss || {}));
