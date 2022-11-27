let barcodeInterval;
window.addEventListener("DOMContentLoaded", function() {
    const frmSearchEl = document.getElementById("frmSearch");
    const barcodeEl = document.getElementById("barcode");
    if (!barcodeEl || !frmSearchEl) {
        return;
    }

    window.addEventListener("keyup", function(e) {
        if (e.key.toLocaleLowerCase() == 'enter') {
            const v = barcodeEl.value.trim();
            if (v) {
                frmSearchEl.onsubmit();
            }   
        }
    });

    const focusAreaEls = document.getElementsByClassName("focus_area");
    for (let el of focusAreaEls) {
        el.addEventListener("click", function() {
            barcodeEl.focus();
        });
    }

    const readyScanEls = document.getElementsByClassName("ready_scan");
    for (let el of readyScanEls) {
        el.addEventListener("click", function() {
            barcodeEl.value="";
            barcodeEl.focus();
        });
    }

    barcodeInterval = setInterval(function() {
        barcodeEl.focus();
    }, 100);

    window.addEventListener("scroll", function() {
        this.clearInterval(barcodeInterval);
    });


    const scanAgainEls = document.getElementsByClassName("scan_again");
    for (let el of scanAgainEls) {
        el.addEventListener("click", function() {
            clearInterval(barcodeInterval);
            barcodeInterval = setInterval(function() {
                barcodeEl.focus();
            }, 100);
        });
    }
});