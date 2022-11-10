function loadjs() {
    console.log("loadjs");
}

function drawClock() {
    var myclk = document.getElementById("clock");
    function showTimeText(){
        var time = new Date();
        var year = time.getFullYear()-2000;
        var month = time.getMonth()+1;
        var day = time.getDate();
        var h = time.getHours();
        var m = time.getMinutes();
        var s = time.getSeconds();
        myclk.innerHTML = "<p style=\"font-size: 15px\">" + year + "." + month + "." + day + "</p></br>" + "<p>" + h + ":" + m + ":" + s + "</p>";
    }
    showTimeText();
    setInterval(showTimeText, 1000);
}