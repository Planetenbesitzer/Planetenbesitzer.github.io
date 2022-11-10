function loadjs() {
    console.log("loadjs");
}

function drawClock() {
    const timefix = new Date("December 24, 2022 08:30:00");
    var myclk = document.getElementById("clock");
    var timeleft = document.getElementById("timeleft");
    function showTimeText(){
        var time = new Date();
        var year = time.getFullYear()-2000;
        var month = time.getMonth()+1;
        var day = time.getDate();
        var h = time.getHours();
        var m = time.getMinutes();
        var s = time.getSeconds();
        myclk.innerHTML = "<p style=\"font-size: 15px\">" + year + "." + month + "." + day + "</p></br>" + "<p>" + h + ":" + m + ":" + s + "</p>";
        var timeDiff = timefix.getTime() - time.getTime();
        var day1 = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        var left1 = timeDiff - day1 * (1000 * 60 * 60 * 24);
        var h1 = Math.floor(left1 / (1000 * 60 * 60));
        var left2 = left1 - h1 * (1000 * 60 * 60);
        var m1 = Math.floor(left2 / (1000 * 60));
        var left3 = left2 - m1 * (1000 * 60);
        var s1 = Math.round(left3 / 1000);
        timeleft.innerHTML = 
        "<p>我们还有" + day1 + "天</p></br><p>" + h1 + "小时" + m1 + "分钟" + s1 + "秒!</p>";
    }
    showTimeText();
    setInterval(showTimeText, 1000);
}