let gl;
let points = [];
let numSubdivisions = 3;
let carpetColor = [0.0, 0.33, 1.0, 1.0];
let bgColor = [1.0, 1.0, 1.0, 1.0];

let uColorLoc;
let bufferId;

// 1. 셰이더 소스 정의
const vsSource = `
  attribute vec2 aPosition;
  void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const fsSource = `
  precision mediump float;
  uniform vec4 uColor;
  void main() {
    gl_FragColor = uColor;
  }
`;

window.onload = function init() {
    const canvas = document.getElementById("gl-canvas");
    gl = canvas.getContext("webgl");
    if (!gl) {
        alert("WebGL을 지원하지 않는 브라우저입니다.");
        return;
    }

    // 셰이더 컴파일 및 프로그램 링크
    const program = createProgram(gl, vsSource, fsSource);
    gl.useProgram(program);

    // 위치 버퍼 생성
    bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);

    const aPositionLoc = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(aPositionLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aPositionLoc);

    uColorLoc = gl.getUniformLocation(program, "uColor");

    setupUI();
    updateCarpet();
};

// 2. 사각형(2개 삼각형) 추가 함수
function addSquare(x1, y1, x2, y2) {
    // 삼각형 1
    points.push(x1, y1);
    points.push(x2, y1);
    points.push(x2, y2);
    // 삼각형 2
    points.push(x1, y1);
    points.push(x2, y2);
    points.push(x1, y2);
}

// 3. 재귀적 9분할 로직
function divideSquare(x, y, size, count) {
    if (count === 0) {
        addSquare(x, y, x + size, y + size);
        return;
    }

    const subSize = size / 3.0;

    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            // 정중앙 (i === 1 && j === 1) 은 건너뛰어 구멍을 냄
            if (i === 1 && j === 1) continue;
            divideSquare(x + i * subSize, y + j * subSize, subSize, count - 1);
        }
    }
}

// 4. 버퍼 갱신 및 렌더링
function updateCarpet() {
    points = [];
    // WebGL 클립 좌표계는 [-1, 1] 범위이므로 (-0.9, -0.9)에서 시작해 크기 1.8로 그림
    divideSquare(-0.9, -0.9, 1.8, numSubdivisions);

    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);

    render();
}

function render() {
    gl.clearColor(bgColor[0], bgColor[1], bgColor[2], bgColor[3]);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.uniform4fv(uColorLoc, carpetColor);
    gl.drawArrays(gl.TRIANGLES, 0, points.length / 2);
}

// 5. UI 이벤트 핸들러
function setupUI() {
    const slider = document.getElementById("subdiv-slider");
    const subdivVal = document.getElementById("subdiv-val");
    slider.addEventListener("input", (e) => {
        numSubdivisions = parseInt(e.target.value);
        subdivVal.textContent = numSubdivisions;
        updateCarpet();
    });

    document.getElementById("carpet-color").addEventListener("input", (e) => {
        carpetColor = hexToRgba(e.target.value);
        render();
    });

    document.getElementById("bg-color").addEventListener("input", (e) => {
        bgColor = hexToRgba(e.target.value);
        render();
    });
}

function hexToRgba(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return [r, g, b, 1.0];
}

// 셰이더 컴파일 유틸리티
function createProgram(gl, vsSource, fsSource) {
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, vsSource);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, fsSource);
    gl.compileShader(fs);

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    return prog;
}
