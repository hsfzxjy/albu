<template>
  <canvas ref="canvas"></canvas>
</template>
<script>
import * as API from "@/api";

export default {
  data() {
    return {
      cPosition: {},
      ctx: null,

      CW: 600,
      CH: 320,
      offsetX: 40,
      offsetY: 30,

      successColor: "#627eed",
      errorColor: "red",
      successInnerColor: "#ffffff",
      errorInnerColor: "#ffffff",
      selectColor: "",
      innerColor: "",

      pointsInfo: [],
      pointLine: [],

      borderWidth: 1,
      pointWidth: 8,
      lineWidth: 3,
      pointRadius: 25,
    };
  },
  async mounted() {
    this.selectColor = this.successColor;
    this.innerColor = this.successInnerColor;
    await this.$nextTick();
    this.init();
    this.initEvents();
  },
  methods: {
    init() {
      this.ctx = this.$refs.canvas.getContext("2d");
      this.initCoordinates();
      this.initPointsInfo();
      this.draw();
    },
    initCoordinates() {
      // this.CH = document.body.offsetHeight;
      this.CW = document.body.offsetWidth;
      this.$refs.canvas.width = this.CW;
      this.$refs.canvas.height = this.CH;
      this.cPosition = this.$refs.canvas.getBoundingClientRect();
    },
    initPointsInfo() {
      this.pointsInfo = [];
      let diffX = (this.CW - this.offsetX * 2 - this.pointRadius * 2 * 3) / 2;
      let diffY = (this.CH - this.offsetY * 2 - this.pointRadius * 2 * 3) / 2;
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          let point = {
            x: this.offsetX + col * diffX + (col * 2 + 1) * this.pointRadius,
            y: this.offsetY + row * diffY + (row * 2 + 1) * this.pointRadius,
          };
          this.pointsInfo.push(point);
        }
      }
    },
    drawLine(touch = null) {
      let pointLine = this.pointLine;
      this.ctx.beginPath();
      for (let i = 0; i < pointLine.length; i++) {
        let point = this.pointsInfo[pointLine[i]];
        this.ctx.lineTo(point.x, point.y);
      }
      this.ctx.strokeStyle = this.selectColor;
      this.ctx.lineWidth = this.lineWidth;
      this.ctx.stroke();
      this.ctx.closePath();
      if (touch !== null) {
        let lastPoint = this.pointsInfo[
          this.pointLine[this.pointLine.length - 1]
        ];
        this.ctx.beginPath();
        this.ctx.moveTo(lastPoint.x, lastPoint.y);
        this.ctx.lineTo(
          touch.pageX - this.cPosition.left,
          touch.pageY - this.cPosition.top
        );
        this.ctx.strokeStyle = this.selectColor;
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.stroke();
        this.ctx.closePath();
      }
    },
    checkTouch(touch) {
      const pointsInfo = this.pointsInfo;
      for (let i = 0; i < pointsInfo.length; i++) {
        const currentPoint = pointsInfo[i];

        const xdiff = Math.abs(
          touch.pageX - currentPoint.x - this.cPosition.left
        );
        const ydiff = Math.abs(
          touch.pageY - currentPoint.y - this.cPosition.top
        );
        const dist = Math.pow(xdiff * xdiff + ydiff * ydiff, 0.5);

        if (dist <= this.pointRadius) {
          let accept = false;
          if (this.pointLine.indexOf(i) === -1 || this.pointLine.length === 0) {
            accept = true;
          } else {
            const lastPoint = this.pointLine[this.pointLine.length - 1];
            accept = !(
              lastPoint % 3 === i % 3 ||
              Math.floor(lastPoint / 3) === Math.floor(i / 3)
            );
          }
          if (accept) this.pointLine.push(i);
          break;
        }
      }
    },
    initEvents() {
      this.$refs.canvas.addEventListener("touchstart", (e) => {
        this.initCoordinates();
        this.reset();
        this.checkTouch(e.touches[0]);
      });
      this.$refs.canvas.addEventListener("touchmove", (e) => {
        this.checkTouch(e.touches[0]);
        this.ctx.clearRect(0, 0, this.CW, this.CH);
        this.draw(e.touches[0]);
        e.preventDefault();
      });
      this.$refs.canvas.addEventListener("touchend", () => {
        this.checkPassword();
        this.ctx.clearRect(0, 0, this.CW, this.CH);
        this.draw();
      });
    },
    reset() {
      this.pointLine = [];
      this.selectColor = this.successColor;
      this.innerColor = this.successInnerColor;
      this.ctx.clearRect(0, 0, this.CW, this.CH);
      this.draw();
    },
    async checkPassword() {
      try {
        this.$emit("matched", await API.login(this.pointLine.join("")));
      } catch (e) {
        this.selectColor = this.errorColor;
        this.draw();
      }
    },
    draw(touch = null) {
      if (this.pointLine.length > 0) this.drawLine(touch);
      let pointsInfo = this.pointsInfo;
      for (let i = 0; i < pointsInfo.length; i++) {
        let point = pointsInfo[i];

        this.ctx.fillStyle = this.selectColor;
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, this.pointRadius, 0, 2 * Math.PI, true);
        this.ctx.fill();
        this.ctx.closePath();

        this.ctx.fillStyle = this.innerColor;
        this.ctx.beginPath();
        this.ctx.arc(
          point.x,
          point.y,
          this.pointRadius - this.borderWidth,
          0,
          2 * Math.PI,
          true
        );
        this.ctx.fill();
        this.ctx.closePath();

        if (this.pointLine.indexOf(i) !== -1) {
          this.ctx.fillStyle = this.selectColor;
          this.ctx.beginPath();
          this.ctx.arc(point.x, point.y, this.pointWidth, 0, 2 * Math.PI, true);
          this.ctx.fill();
          this.ctx.closePath();
        }
      }
    },
  },
};
</script>