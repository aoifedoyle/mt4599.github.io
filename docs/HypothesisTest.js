
/*
Using classes to make the code neater and easier to read. 
Class for each curve, but share the same canvas. This is so the alpha values can be shared across both classes.

The code is split into sections. Each section is marked with a > followed by a letter.
From >M onwards the functions are called. 
*/
class curve {
    /* >A
    Constructor is called when the class is first crated.  
    Each variable has the word 'this.' added to the front on the variable name. 
    The 'this.' makes the variable belong to the class as opposed to global variables from
    outside the class.
    */
    constructor(canv, canvas_left, canv_width, canvas_bottom, canv_height, vis) 
    {
        this.canvas = canv; //link to the HTML canvas object
        this.canv_bottom = canvas_bottom; //the bottom or the region of the canvas for this class.
        this.canv_height = canv_height; 
        this.canv_left = canvas_left;
        this.canv_width = canv_width;
        this.xMidpoint = canv_width/2;
        this.yBorder = 30;
        this.yOffset = this.canv_bottom - this.yBorder; // buffer up from bottom of canvas for xaxis
        this.yScale= canv_height; // used to fit the curve within the canv area
        this.curve_visible = vis;
        this.outside_colour = "white";  // colours the area below the curve outside the alpha boundaries
        this.inside_colour = "rgba(0,0,255,0.2)"; // colours the area of curve within the alpha
        this.ctx = this.canvas.getContext("2d"); 
        //this.curve_visible = true;
        this.vis_inside = false; // area under the curve betwen the alpha markers
        this.vis_outside=false;  // area under curve outside the alpha markers
        this.vis_x_labels = false; // labels under the x axis
        this.x_alpha=0;
        this.stddev=1;
        this.mean =0;
        this.mouse_active = false;
        //Two class functions are called.
        this.update_std_vars();
        this.update_alpha();
        //Defualt for text
        this.ctx.lineWidth = 1;
        this.ctx.fillStyle = "black";
        this.ctx.font = "12px Arial";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "top";
    }
    
    /* >B
    Clears the canvas area.
    */
    clear()
    {
      this.ctx.clearRect(this.canv_left, (this.canv_bottom -this.canv_height), this.canv_width, this.canv_height);
    }
  
    /* >C
    Draws the curve and all the other elements on the canvas.
    This is the main calling point where some of the following code is called.
    */
    draw() 
    {
      this.clear();
      if (this.curve_visible) 
      {
        if (this.vis_outside) 
        {
          this.draw_outside_area();
        }
        if (this.vis_inside) 
        {
          this.draw_inside_area();
        }
        this.draw_curve();
        this.draw_xaxis();
  
        if (this.vis_x_labels) 
        {
          this.draw_x_labels();
        }
  
        this.draw_alpha_boundaries();
        if (this.vis_inside) 
        {
          this.print_population_inside_markers();
        }
        if (this.vis_outside) 
        {
          this.print_population_outside_markers();
        }
          
        this.display_mean();
      }
    }
  
    /* >D
    The code to generate and plot the Normal distribution curve.
    Called from >C. 
    */
    draw_curve()
    {
      //multiplier is also yMax when x = the mean value; 
      let mult = 1 / (this.stddev * Math.sqrt(2 * Math.PI));
      // scale the curve to always fit within the canv height
      this.yScale = (this.canv_height - this.yBorder -1) / mult;
      let stddev_squared = this.stddev * this.stddev; //calc once rather than for every point
      this.ctx.strokeStyle = "black";
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([]);
      this.ctx.fillStyle = "white";
      this.ctx.beginPath();
      this.ctx.moveTo(this.canv_width,this.yOffset);  //start at bottom right
      for (let x=this.xMax; x >= this.xMin; x-=this.step) 
      {
        //draw the points in a clockwise direction, ie from bottom right, to bottom left 
        let y = this.yScale * mult * Math.exp(-0.5 * (x - this.mean ) * (x - this.mean) / stddev_squared);
        this.ctx.lineTo((this.xMidpoint + (x/ this.step)) , this.yOffset - y );
      }
      this.ctx.stroke();  //draw the curve
      this.ctx.lineTo(this.canv_left, this.yOffset); //bottom left,
      this.ctx.lineTo(this.canv_left,this.canv_bottom-this.canv_height); //top left
      this.ctx.lineTo(this.canv_width,(this.canv_bottom-this.canv_height)); //top right
      this.ctx.fill();
      this.ctx.closePath();
      this.ctx.fillStyle = "#000000"; // default back to none
    }

    /* >E called from >C
    Code to draw the alpha lines. 
    */
    draw_alpha_boundaries()
    {
      //Drawing the dashed lines for the alpha boundaries
      this.ctx.strokeStyle = "red";
      this.ctx.lineWidth = 1;
      this.ctx.setLineDash([5, 3]);
      let x = (this.x_alpha * this.stddev)  / this.step;
      //Left hand line
      this.ctx.beginPath();
      this.ctx.moveTo((this.xMidpoint - x) , this.canv_bottom - this.canv_height);
      this.ctx.lineTo((this.xMidpoint - x) , this.canv_bottom);
      this.ctx.stroke();
      //Right hand line
      this.ctx.beginPath();
      this.ctx.moveTo((this.xMidpoint + x) , this.canv_bottom - this.canv_height);
      this.ctx.lineTo((this.xMidpoint + x) , this.canv_bottom);
      this.ctx.stroke();
    }
  
    /* >F
    Called from >C. 
    Creates two rectangles of colour for the areas beyond the alpha markers. 
    These get overwritten (erased) by the curve. 
    */
    draw_outside_area()
    {
      let x = (this.x_alpha * this.stddev)  / this.step;
  
      //Lower area fill
      this.ctx.fillStyle = this.outside_colour;
      this.ctx.fillRect(0, this.canv_bottom-this.canv_height, this.xMidpoint-x, this.canv_height-this.yBorder);
  
      //Lower area fill
      this.ctx.fillStyle = this.outside_colour;
      this.ctx.fillRect(this.xMidpoint+x, this.canv_bottom-this.canv_height, this.canv_width, this.canv_height-this.yBorder);
    }
    
    /* >G
    Called from >C.  
    Creates one rectangle of colour for the area between the alpha markers. 
    This get overwritten (erased) by the curve
    */
    draw_inside_area()
    {
      let x = (this.x_alpha * this.stddev)  / this.step;
      this.ctx.fillStyle = this.inside_colour;
      this.ctx.fillRect(this.xMidpoint-x, this.canv_bottom-this.canv_height, 2*x, this.canv_height-this.yBorder);
    }
    
    /* >H
    Draws the x-axis. Called from >C
    */
    draw_xaxis()
    {
      this.ctx.strokeStyle = "black";
      this.ctx.setLineDash([]);
  
      //Draw x-axis
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(0, this.yOffset);
      this.ctx.lineTo(this.canvas.width, this.yOffset);
      this.ctx.stroke();
    }
  
    /* >J
    Add labels for each stddev point. Called from >C. 
    */
    draw_x_labels()
    {
      //Draw x-axis labels 
      this.ctx.lineWidth = 1;
      this.ctx.fillStyle = "black";
      this.ctx.font = "12px Arial";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "top";
      for (let i = -4; i <=4; i++)
      {
          let x = i * this.stddev;
          let p= this.xMidpoint + (x/this.step)
          //let p= this.xMidpoint - this.mean + (x/this.step)
          // draw tick mark
          this.ctx.beginPath();
          this.ctx.moveTo(p, this.yOffset - 4);
          this.ctx.lineTo(p, this.yOffset + 4);
          this.ctx.stroke();
          //print stddev value
          this.ctx.fillText(x.toFixed(2), p, this.yOffset + 4 );
          this.ctx.fillText('standard deviations', this.xMidpoint, this.yOffset + 15 );
      }
    }
  
    /* >K
    Calculates the population within the alpha markers (used by curve2). Called from >C
    */
    print_population_inside_markers()
    {
      let t2 = this.calc_upper_cdf() - this.calc_lower_cdf();
      let text = "Type 2 error = " + t2.toFixed(2);
      this.ctx.fillText(text, this.xMidpoint, this.canv_bottom - (this.canv_height/2));  
    }
  
    /* >L
    Calculates and prints the populationn outside the markers. Called from >C
    */
    print_population_outside_markers()
    {
      let power = (1 - this.calc_upper_cdf()) + this.calc_lower_cdf();
      let text = this.outside_text + power.toFixed(2);
      let x = (this.x_alpha * this.stddev)  / this.step;
      this.ctx.fillText(text, this.xMidpoint+x+50, this.canv_bottom - (this.canv_height/8));  
    }
    //helpers to calculate the populations under the sections of the curve above
    calc_lower_cdf()
    {
      let lower_cdf = jStat.normal.cdf(( 0 - (this.x_alpha * this.stddev) ), this.mean, this.stddev);
      return lower_cdf;
    }
    calc_upper_cdf()
    {
      let upper_cdf = jStat.normal.cdf(( this.x_alpha * this.stddev ), this.mean, this.stddev);
      return upper_cdf;
    }
  
    /* >M
    Code for updating the stddev. 
    The value shown in the HTML window for stddev is held as a text string. 
    The event listener >T calls the below function, and ondraw function >AC. 
    This function converts the text string, sent from the HTML into a floating point number. 
    Calls update_std_vars() >N to update the stddev variables.
    Then call draw() >C to clean and re-draw the curve with the updated data. 
    */
    update_stdval(val) 
    {
      this.stddev = parseFloat(val);
      if (this.stddev == NaN)
      {
        return;
      }
      this.update_std_vars();
      this.draw();
    }
  
    /* >N
    This updates all the variables that are assocaited with the stddev of the curve. 
    Called from >M above.
    Had to strech xMin and xMax to 10* stdev to allow the second curve to be 
    moved and still drawn correctly. 
    */
    update_std_vars() 
    {
      this.xMin = this.mean - (10 * this.stddev);
      this.xMax = this.mean + (10 * this.stddev);
      this.step = (this.xMax - this.xMin)/this.canv_width;
      this.step = 10/ this.canv_width;
    }
  
    /* >P
    This is the code for the alpha values. 
    It is called by the event listener >U, >AC and >A.
    Similarly to stddev it converts the HTML text string for alpha into a floating point number. 
    It updates the variables used in alpha calculation. 
    */
    update_alpha(val) 
    {
      this.alpha = parseFloat(val);
      if (this.alpha == NaN)
      {
        return;
      }
      this.calc_x_alpha();
    }
  
    /* >Q
    Visualisation of alpha. 
    This is called by >P to convert the alpha value into the position along the stdDev line.
    This is called by >T after the stddev is updated.
    */
    calc_x_alpha()
    {
      this.x_alpha = jStat.normal.inv((1 - this.alpha / 2), 0 /*mean*/ , 1 /*stddev*/);
    }
  
    /* >R
    Called by the mouse event listener >AB to calculate the change in mean as a result of 
    the curve being moved left or right.
    */
    MoveHorizontal(xval){
      if (this.curve_visible == true) 
      {
        this.mean = this.mean + (xval* 0.01);
      }
    }
    
    /* >S
    Displays the mean value in the HTML window.
    */
    display_mean() {
        this.ctx.fillStyle = "black";
        this.ctx.font = "12px Arial";
        this.ctx.textAlign = "center";
        this.ctx.fillText("Mean = " + this.mean.toFixed(2), this.xMidpoint, this.yOffset - 10);
    }   
  }  // end of curve class
  
  
  // Start of non-class code
  // link to the HTML canvas
  const canvas1 = document.getElementById("canvas1");
  
  /* >T
  Creates the two curves, curve1 and curve2.
  curve1 is the top half of the canvas, curve2 is the bottom half.
  */
  ctx = canvas1.getContext("2d");
  let h = canvas1.height/2;
  let w = canvas1.width;
  // call the constructor of each curve passing (canv, canvas_left, canv_width, canvas_bottom, canv_height, visible)
  const curve1 = new curve(canvas1, 0, w, h, h, true); //top half of canvas
  const curve2 = new curve(canvas1, 0, w, (2*h), h, false); // bottom half of canvas
  
  /* 
  The next 3 sections add event_listeners to the buttons /input fields in the HTML code.
  For each event_listener, functions are called within each of the curve1 and curve2 objects. 
  */
  /* >U
  listener 1: pass the HTML stdval_slider text to the curve update_stdval function. 
  */
  document.getElementById("stddev_slider").addEventListener("change", function() {
    curve1.update_stdval(this.value); 
    curve2.update_stdval(this.value); 
    curve1.calc_x_alpha(); 
    curve2.calc_x_alpha(); 
    curve1.draw();
    curve2.draw();
  });
  
  /* >V
  listener 2: pass the HTML alpha_value text to the update_alpha function of both classes
  then make the alpha lines visible 
  */
  document.getElementById("alpha_value").addEventListener("change", function() {
    curve1.update_alpha(this.value); 
    curve2.update_alpha(this.value); 
    curve1.draw();
    curve2.draw();  
  });
 
  /* >W
  listeners to show/hide the areas underneath the curves
  */
  document.getElementById("vis_inside").addEventListener("change", function() {
    curve2.vis_inside=false;
    if (this.checked)
    {
      curve2.vis_inside=true;
    }
    curve2.draw();
  });
  
  /* CURVE 1 */
  document.getElementById("vis_outside").addEventListener("change", function() {
    curve1.vis_outside=false;
    if (this.checked)
    {
      curve1.vis_outside=true;
    }
    curve1.draw();
  });
  
  /* CURVE 2 */
  document.getElementById("vis_power").addEventListener("change", function() {
    curve2.vis_outside=false;
    if (this.checked)
    {
      curve2.vis_outside=true;
    }
    curve2.draw();
  });
  
  /* >Y
   listener to show/hide curve2
  */
  document.getElementById("alt_dist").addEventListener("change", function() {
    if (this.checked)
    {
      curve2.curve_visible=true;
      document.getElementById("f1").hidden = false;
    }
    else
    {
      curve2.curve_visible=false;
      document.getElementById("f1").hidden = true;
    }
    curve2.draw();
  });
  
  /*  
  three listners for the mouse left button down, left button up, and 
  mouse movement within the bottom half of the canvas. (eg curve 2)
   */
  let mouseselected = false;
  let startx = 0;
  /* >Z
  event listener for when the mouse left key is held down
  sets mouseselected variable (could use >K )
  */
  canvas1.addEventListener("mousedown", (e) => {
    startx = e.offsetX;
    mouseselected = true;
  });
  /* >AA
  event listener for when the mouse left key is released
  clears mouseselected variable (could use >K )
  */
  canvas1.addEventListener("mouseup", (e) => {
    mouseselected = false;
  });
  /* >AB
  event listener for when the mouse is moving
  based on mouseselected calls >L. 
  */
  canvas1.addEventListener("mousemove", (e) =>  {
    if (mouseselected == true) 
    {
      curve2.MoveHorizontal(e.offsetX-startx);
      startx = e.offsetX;
      let lower_cdf =curve2.calc_lower_cdf();
      let upper_cdf =curve2.calc_upper_cdf();
      let power = lower_cdf + (1 - upper_cdf);
      let T2 = upper_cdf - lower_cdf;
      curve2.draw();
    }
  });
  
  /* >AC
  When the window is loaded, setup some different values for each curve, eg the colour 
  of the areas within/outaside the alpha markers.
  Get the default values from the HTML input fields, update with draw the curves.
  */
  window.onload = function() {
    // setup some defaults that differ abetween the top and bottom curve
    curve1.outside_colour = "rgba(255,0,0,0.2)";
    curve2.outside_colour = "rgba(150,200,200,0.4)";
    curve1.vis_x_labels = true;
    curve1.outside_text="Type 1 error=";
    curve2.outside_text="Power=";
  
    let std = document.getElementById("stddev_slider");
    curve1.update_stdval(std.value);
    let alpha = document.getElementById("alpha_value");
    curve1.update_alpha(alpha.value); 
    curve2.update_alpha(alpha.value); 
    curve1.draw(); 
  
    if (curve2.curve_visible == false)
    {
      document.getElementById("f1").hidden = true;
    }
  }
  
  
