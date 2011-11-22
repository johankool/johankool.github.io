---
layout: product
title: "Waterfall"
app-id: 372513906
tagline: The ice caps are melting, you have to rebuild them one water molecule at a time!
icon: waterfall_icon_128.png
comments: false
sharing: true
footer: true
---

Waterfall is a simple, fun, and highly addictive game that teaches you about ice and nanoscience.

### High Scores

<script type="text/javascript">
var http = false;

if(navigator.appName == "Microsoft Internet Explorer") {
  http = new ActiveXObject("Microsoft.XMLHTTP");
} else {
  http = new XMLHttpRequest();
} 

String.prototype.escapeHTML = function () {
  return (this.replace(/&/g,'&amp;').replace(/>/g,'&gt;').replace(/</g,'&lt;').replace(/"/g,'&quot;'));                              
};

function getscores() {
  http.open("GET", "/highscores/?appName=Waterfall&type=json", true);
  http.onreadystatechange=function() {
    if (http.readyState == 4) {
      var responseText = JSON.parse(http.responseText);
      var highscores = responseText["highscores"];
      var table = "<table width='100%'><th><tr><td>No.</td><td>Name</td><td>Score</td><td>Level</td></tr></th>";
      var counter = 0;
      for (no in highscores) {
         var highscore = highscores[no];
         counter += 1;
         table += "<tr><td>"+counter+"</td><td>"+highscore["name"].escapeHTML()+"</td><td>"+highscore["score"]+"</td><td>"+highscore["level"]+"</td></tr>";
      };
      table += "</table>";
      document.getElementById('highscores').innerHTML = table;
    }
  }
  http.send(null);
}

$.domReady(getscores());
</script>

<div id="highscores">
</div>

<a class="button" href="javascript:getscores()">Refresh High Scores</a> 
