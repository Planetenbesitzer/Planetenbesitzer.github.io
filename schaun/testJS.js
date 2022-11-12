// this is a test file to learn javascript

document.ondragover = function(e){
    e.preventDefault();
}

function hashCode(str) {
    var h = 0;
    var len = str.length;
    var t = 2147483648;
    for (var i = 0; i < len; i++) {
        h = 31 * h + str.charCodeAt(i);
        if (h > 2147483647) h %= t; //java int溢出则取模
    }
    return h;
}

function showGate(){
    var btn = document.getElementById("mybtn")
    btn.onclick = gotoLink
    btn.innerHTML = "<strong>Gate</strong> ['|']"
}

function clkBtn()
{
    x=document.getElementById("box1");
    // x.value = "Now I am not the original text";
    var h = hashCode(x.value)
    if (h == 1668){
        alert("Oooops! Great for you!")
        showGate()
    }
    else {
        x.value = "sorry, you may want to try again~"
    }
}

function alignPosition(id_frame, id_block, propotion){
    frame = document.getElementById(id_frame)
    block = document.getElementById(id_block)

    block.style.marginLeft=(propotion*frame.clientWidth-block.clientWidth/2)+"px";
    // console.log(block.style.marginLeft)
}

function mOver(obj){
    img = obj.getElementsByTagName('img')[0]
    margLeft = Number(getComputedStyle(obj).marginLeft.replace("px",""))
    margRight = Number(getComputedStyle(obj).marginRight.replace("px",""))
    if (obj.position == 0){
        // img.src = "images/sheep.gif"
        img.style.transform = "rotateY(180deg)"
        obj.style.marginLeft = (Number(margLeft)+obj.boxWidth)+"px";
        obj.position += 1;
        console.log(obj.position)
        var btn = document.getElementById("mybtn")
        btn.onclick = clkBtn
        btn.innerHTML = "Submit ! !"
    }
    else if (obj.position == 12){
        // img.src = "images/sheep1.gif"
        img.style.transform = "rotateY(0deg)"
        obj.style.marginLeft = (Number(margLeft)-obj.boxWidth)+"px";
        obj.position -= 1;
        console.log(obj.position)
    }
    // if <1/2, change to sheep1 and go to left
    else if (Math.random() < 0.5){
        // img.src = "images/sheep1.gif"
        img.style.transform = "rotateY(0deg)"
        obj.style.marginLeft = (Number(margLeft)-obj.boxWidth)+"px";
        obj.position -= 1;
        console.log(obj.position)
        if (obj.position == 0){showGate()}
    }
    else {
        // img.src = "images/sheep.gif"
        img.style.transform = "rotateY(180deg)"
        obj.style.marginLeft = (Number(margLeft)+obj.boxWidth)+"px";
        obj.position += 1;
        console.log(obj.position)
    }
    // console.log(img.src.match("sheep1"))
    // console.log(Math.random())
    // if >= 1/2, change to sheep and go to right
}

function gotoLink() {
    console.log("go to link")
    window.location = "https://planetenbesitzer.github.io/"
}
