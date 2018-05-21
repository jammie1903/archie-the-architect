
const SpinnerFrames =  ["|", "/", "-", "\\"];
module.exports = class Spinner {

    constructor() {
        this.running = false;
    }

    start() {
        if (this.running) {
            return;
        }
        this.frame = 0;
        this.firstFrame = true;

        const tick = () => {
            this.tick();
            this.next = setTimeout(() => {
                tick();
            }, 100);
        }
        this.running = true;
        tick();
    }

    tick() {
        if (!this.firstFrame) {
            process.stdout.write("\u001b[1D");
        } else {
            this.firstFrame = false;
        }
        process.stdout.write(SpinnerFrames[this.frame]);
        this.frame = (this.frame + 1) % SpinnerFrames.length;
    }

    stop() {
        if (!this.running) {
            return;
        }
        clearTimeout(this.next);
        console.log("\u001b[1D ");
    }
}
