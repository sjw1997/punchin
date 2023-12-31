let year = (new Date()).getFullYear();
let month = (new Date()).getMonth() + 1;
let items = [];
const startMinutes = 25, startSeconds = 0;
let minutes = startMinutes, seconds = startSeconds;
let interval_id = -1;
const userId = 3;
let scores = 0, currentDayId = -1, targetFocusSeconds = -1, username = "";

function getDays() {
    $.ajax ({
        url: `https://iamsjw.com/api/tomato/get/days/${userId}/`,
        type: "GET",
        success: function(resp) {
            if (resp["result"] === "success") {
                items = resp["items"];
                printDays();
                printCounter();
                printCircleProgress();
            }
        }
    })
}

function getUserInfo() {
    $.ajax ({
        url: `https://iamsjw.com/api/tomato/get/user_info/${userId}/`,
        type: "GET",
        success: function(resp) {
            if (resp["result"] === "success") {
                scores = resp["scores"];
                targetFocusSeconds = resp["targetFocusSeconds"];
                username = resp["username"];
                getCurrentDayId();
            }
        }
    })
}

function getCurrentDayId() {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const day = currentDate.getDate();

    $.ajax ({
        url: `https://iamsjw.com/api/tomato/get/current_day_id/`,
        type: "GET",
        data: {
            userId,
            year,
            month,
            day
        },
        success: function(resp) {
            if (resp["result"] === "success") {
                currentDayId = resp["id"];
                getDays();
            }
        }
    })
}

function updateFocusSeconds() {
    $.ajax ({
        url: `https://iamsjw.com/api/tomato/update/focus_seconds/`,
        type: "POST",
        data: {
            userId,
            tomatoDaysId: currentDayId,
            focusSeconds: startMinutes * 60 + startSeconds
        },
        success: function(resp) {
            if (resp["result"] === "success") {
                for (const item of items) {
                    if (item.id === currentDayId) {
                        item.focusSeconds += startMinutes * 60 + startSeconds;

                        if (resp["isReachedTarget"]) {
                            item.state = true;
                            scores += 10;
                            const myModalAlternative = new bootstrap.Modal('#myModal');
                            myModalAlternative.show();
                        }
                    }
                }

                printDays();
                printCounter();
                printCircleProgress();
            }
        }
    })
}

function updateScores(delta) {
    $.ajax ({
        url: `https://iamsjw.com/api/tomato/update/scores/`,
        type: "POST",
        data: {
            userId,
            delta,
        },
        success: function(resp) {
            if (resp["result"] === "success") {
                scores += delta;
                printCounter();
            }
        }
    })
}

function updateTargetFocusSeconds(newTargetFocusSeconds) {
    $.ajax({
        url: "https://iamsjw.com/api/tomato/update/target_focus_seconds/",
        data: {
            userId,
            newTargetFocusSeconds,
        },
        type: "POST",
        success(resp) {
            targetFocusSeconds = newTargetFocusSeconds;
            printCircleProgress();
        }
    })
}

function printMonth() {
    $(".tomato-container-month > .col").text(`${year} 年 ${month} 月`);
}

function printWhatDay() {
    const container = $('.tomato-container-whatday');
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (const day of days) {
        container.append(`<div class="col">${day}</div>`);
    }
}

function howManyDays(year, month) {
    const a = [1, 3, 5, 7, 8, 10, 12];
    const b = [4, 6, 9, 11];
    for (const i of a) {
        if (i === month) return 31;
    }
    for (const i of b) {
        if (i === month) return 30;
    }   
    if (year % 4 === 0 && year % 100 !== 0 || year % 400 === 0) return 29;
    return 28;
}

function check(year, month, day) {
    for (const item of items) {
        if (item.year === year && item.month === month && item.day === day) {
            return [item.state, ...secondsSplit(item.focusSeconds)];
        }
    }
    return [false, 0, 0, 0];
}

function printDays() {
    const s = $('.tomato-container-days-container');
    s.text("");

    const days = howManyDays(year, month);
    let whichDay = (new Date(year, month-1, 1)).getDay();  //该年该月1号是星期几

    const finished = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" color="green"><path fill-rule="evenodd" d="M20 12.005v-.828a1 1 0 112 0v.829a10 10 0 11-5.93-9.14 1 1 0 01-.814 1.826A8 8 0 1020 12.005zM8.593 10.852a1 1 0 011.414 0L12 12.844l8.293-8.3a1 1 0 011.415 1.413l-9 9.009a1 1 0 01-1.415 0l-2.7-2.7a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>';

    let str = "";
    for (let i = 0; i <= whichDay - 1; i ++ ) {
        str = str + `<div class="col"></div>`;
    }

    for (let i = 1; i <= days; ) {
        for (; whichDay < 7; whichDay ++, i ++ ) {
            if (i <= days) {
                const [isReachedTarget, hours, minutes, seconds] = check(year, month, i);
                const popoverStr = `data-bs-toggle="popover"  data-bs-placement="bottom"  data-bs-trigger="hover focus" data-bs-content="${hours}小时 ${minutes}分钟 ${seconds}秒"`;
                if (!isReachedTarget)
                    str = str + `<div class="col tomato-container-day" ${popoverStr}>${i}</div>`
                else
                    str = str + `<div class="col tomato-container-day" ${popoverStr}>${finished}</div>`
            }
            else str = str + `<div class="col"></div>`;
        }

        s.append(`<div class="row">${str}</div>`)

        whichDay = 0;
        str = "";
    }

    const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]');
    const popoverList = [...popoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl));
}

function secondsSplit(seconds) {
    const hours = parseInt(seconds / 3600);
    seconds -= hours * 3600;
    const minutes = parseInt(seconds / 60);
    seconds -= minutes * 60;
    return [hours, minutes, seconds];
}

function printCounter() {
    let cnt = 0, totFoucsSeconds = 0;
    for (const item of items) {
        totFoucsSeconds += item.focusSeconds;
        if (item.state) cnt ++ ;
    }

    const [hours, minutes, seconds] = secondsSplit(totFoucsSeconds);

    const totFoucsHours = parseInt(totFoucsSeconds / 3600);
    totFoucsSeconds -= totFoucsHours * 3600;
    const totFoucsMinutes = parseInt(totFoucsSeconds / 60);
    totFoucsSeconds -= totFoucsMinutes * 60;

    const coinSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" fill="currentColor" class="bi bi-coin" viewBox="0 0 16 16">
    <path d="M5.5 9.511c.076.954.83 1.697 2.182 1.785V12h.6v-.709c1.4-.098 2.218-.846 2.218-1.932 0-.987-.626-1.496-1.745-1.76l-.473-.112V5.57c.6.068.982.396 1.074.85h1.052c-.076-.919-.864-1.638-2.126-1.716V4h-.6v.719c-1.195.117-2.01.836-2.01 1.853 0 .9.606 1.472 1.613 1.707l.397.098v2.034c-.615-.093-1.022-.43-1.114-.9H5.5zm2.177-2.166c-.59-.137-.91-.416-.91-.836 0-.47.345-.822.915-.925v1.76h-.005zm.692 1.193c.717.166 1.048.435 1.048.91 0 .542-.412.914-1.135.982V8.518l.087.02z"/>
    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
    <path d="M8 13.5a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11zm0 .5A6 6 0 1 0 8 2a6 6 0 0 0 0 12z"/>
    </svg>`;
    const t = $('.tomato-counter')
    t.text("");
    t.append(`${coinSvg} ${scores} <br>`);
    t.append(`已打卡${cnt}天<br>`);
    t.append(`总专注时长： ${hours}小时 ${minutes} 分钟 ${seconds}秒`);
}

function printFocusSeconds(minutes, seconds) {
    $('.clock-time-display').text(`${zero(minutes)}:${zero(seconds)}`);
}

function zero(t) {
    return t > 9 ? t : ('0' + t);
}

function modifyCoutdown() {
    const b = $("#button-clock");
    const text = b.text();
    if (text === "开始") {
        b.text("暂停");
        interval_id = setInterval(() => {
            seconds -- ;
            if (seconds < 0) {
                minutes -- ;
                if (minutes < 0) {
                    clearInterval(interval_id);
                    updateFocusSeconds();
                    minutes = startMinutes;
                    seconds = startSeconds;
                    b.text("开始");

                    if (Notification.permission === "granted") {
                        const notification = new Notification("此个番茄时钟结束了！休息会吧");
                    }
                } else {
                    seconds = 59;
                }
            }
            printFocusSeconds(minutes, seconds);
        }, 1000);
    } else if (text === "暂停") {
        b.text("开始");
        clearInterval(interval_id);
    }
}

function bindBtnEvent() {
    $('.button-page').on('click', function(e) {
        const text = "" + e.currentTarget.innerText;

        if (text === "本月") {
            year = (new Date()).getFullYear();
            month = (new Date()).getMonth() + 1;
        } else if (text === "<") {
            month -- ;
            if (month === 0) {
                year -- ;
                month = 12;
            }
        } else if (text === ">") {
            month ++ ;
            if (month === 13) {
                year ++ ;
                month = 1;
            }
        }

        printMonth();
        printDays();
    });

    $('#button-clock').on('click', modifyCoutdown);

    document.addEventListener('keydown', function(event) {
        if (event.code === 'Space') {
          modifyCoutdown();
        }
    });
}

function printCircleProgress() {
    var canvas = document.getElementById("tutorial");
    if (canvas.getContext) {
        var ctx = canvas.getContext("2d");
        const width = canvas.width, height = canvas.height;

        var x = parseInt(width / 2), y = parseInt(height / 2);
        var r2 = parseInt(Math.min(width, height) / 2);
        var r1 = parseInt(Math.min(width, height) / 2.5);
        var startAngle = 0, endAngle = Math.PI * 2;
        

        ctx.beginPath();
        ctx.arc(x, y, r2, startAngle, endAngle);
        ctx.fillStyle = "#F4F4F5";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, r1, startAngle, endAngle);
        ctx.fillStyle = "#FDFDFE";
        ctx.fill();


        let focusSeconds = 0;
        for (const item of items) {
            if (item.id === currentDayId) {
                focusSeconds = item.focusSeconds;
                break;
            }
        }

        var delta = Math.PI * 2 * Math.min(1, focusSeconds / targetFocusSeconds);
        startAngle = -0.5 * Math.PI;
        endAngle = startAngle + delta;

        ctx.beginPath();
        ctx.arc(x, y, r2, startAngle, endAngle);
        ctx.arc(x, y, r1, endAngle, startAngle, true);
        ctx.lineTo(x, y - r2);
        ctx.fillStyle = "#17CEA2";
        ctx.fill();

        ctx.font = "20px sans-serif";
        ctx.fillStyle = "black";
        ctx.fillText(`每日目标`, x - 37, y - 30);

        ctx.font = "30px sans-serif";
        const str = `${(targetFocusSeconds / 3600).toFixed(1)}小时`
        ctx.fillText(str, x - str.length * 11 + 10, y + 10);

        const [hours, minutes, seconds] = secondsSplit(focusSeconds);
        $("#today-focus-time").text(`已完成： ${hours}小时 ${minutes}分钟 ${seconds}秒`);
    }
}

function init() {
    getUserInfo();
    printMonth();
    printWhatDay();
    printDays();
    printFocusSeconds(startMinutes, startSeconds);
    bindBtnEvent();
}

export {
    init
}