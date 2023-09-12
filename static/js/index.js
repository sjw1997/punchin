let year = (new Date()).getFullYear();
let month = (new Date()).getMonth() + 1;
let items = [];

function count() {
    let cnt = 0;
    for (let i = 0; i < items.length; i ++) {
        if (!items[i].state) continue;

        let flag = true;
        for (let j = i + 1; j < items.length; j ++ ) {
            if (items[j].year === items[i].year && items[j].month === items[i].month && items[j].day === items[i].day) {
                flag = false;
                break;
            }
        }

        if (flag) cnt ++ ;
    }
    return cnt;
}

function getItems() {
    $.ajax ({
        url: "https://iamsjw.com/api/punchin/getdays/",
        type: "GET",
        success: function(resp) {
            if (resp["result"] === "success") {
                items = resp["items"];
                printDays();
                $('.punchin-counter').text(`已打卡${count()}天`);
            }
        }
    })
}

function printMonth() {
    $(".punchin-container-month > .col").text(`${year} 年 ${month} 月`);
}

function printWhatDay() {
    const container = $('.punchin-container-whatday');
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
        if (item.year === year && item.month === month && item.day === day && item.state) {
            return true;
        }
    }
    return false;
}

function printDays() {
    const s = $('.punchin-container-days-container');
    s.text("");

    const days = howManyDays(year, month);
    let whichDay = (new Date(year, month-1, 1)).getDay();  //该年该月1号是星期几

    const finished = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" class="punchin-container-budge"><path fill-rule="evenodd" d="M20 12.005v-.828a1 1 0 112 0v.829a10 10 0 11-5.93-9.14 1 1 0 01-.814 1.826A8 8 0 1020 12.005zM8.593 10.852a1 1 0 011.414 0L12 12.844l8.293-8.3a1 1 0 011.415 1.413l-9 9.009a1 1 0 01-1.415 0l-2.7-2.7a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>';

    let str = "";
    for (let i = 0; i <= whichDay - 1; i ++ ) {
        str = str + `<div class="col"></div>`;
    }

    for (let i = 1; i <= days; ) {
        for (; whichDay < 7; whichDay ++, i ++ ) {
            if (i <= days) {
                if (!check(year, month, i))
                    str = str + `<div class="col punchin-container-day">${i}</div>`
                else
                    str = str + `<div class="col punchin-container-day">${finished}</div>`
            }
            else str = str + `<div class="col punchin-container-day"></div>`;
        }

        s.append(`<div class="row">${str}</div>`)

        whichDay = 0;
        str = "";
    }

    bindEvent();
}

function bindEvent() {
    $('.punchin-container-day').on('click', function(e) {
        const text = "" + e.currentTarget.innerHTML;
        if (text.indexOf("svg") === -1) {
            $.ajax({
                type: "POST",
                url: "https://iamsjw.com/api/punchin/addday/",
                data: {
                    year,
                    month,
                    day: parseInt(text),
                    state: true
                },
                dataType: "json",
                success: function (resp) {
                    if (resp["result"] === "success") {
                        getItems();
                    }
                }
            });
        }
    })
}

function bindBtnEvent() {
    $('.btn').on('click', function(e) {
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
}

export {
    printWhatDay,
    printDays,
    printMonth,
    getItems,
    bindBtnEvent,
}