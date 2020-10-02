import raf from "raf"

// noinspection ES6UnusedImports
import STYLE from "./style.css"
import Color from "./Color";

const GOLDEN = 2 / (1 + Math.sqrt(5));
const TAU = Math.PI * 2;
const DEG2RAD_FACTOR = TAU / 360;

const config = {
    width: 0,
    height: 0
};

const maxNum = 1200;

const d_next = 0;
const d_prev = 1;
const d_x = 2;
const d_y = 3;
const d_size = 4;

const insertChance = 0.8;

const data = new Float32Array((maxNum + 4 /* safety margin because we might add 4 at a time */) * d_size)

let ctx, canvas, width, height;

let hue, hueStep, lightness, saturation;


function init()
{

    hue = Math.random();
    hueStep = Math.random() < 0.5 ? -0.5 : 0.5;

    lightness = 0.25 +  Math.random() * 0.5;
    saturation = 0.75 +  Math.random() * 0.25;


    const num = 200;
    const radius = 250;
    const step = TAU / num;

    let offset = 0;
    let angle = 0;
    for (let i = 0; i < num; i++)
    {
        data[offset + d_prev] = offset - d_size;
        data[offset + d_next] = offset + d_size;
        data[offset + d_x] = Math.cos(angle) * radius;
        data[offset + d_y] = Math.sin(angle) * radius;

        angle += step;
        offset += d_size;
    }

    const last = offset - d_size;

    data[last + d_next] = 0;
    data[d_prev] = last;

    return offset;
}


function clearScreen()
{
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);
}


function drawPoints(initialSize)
{
    ctx.fillStyle = "#f00";

    const cx = width >> 1;
    const cy = (height * GOLDEN)|0;

    let pos = 0;
    do
    {
        const next = data[pos + d_next];
        const x = data[pos + d_x];
        const y = data[pos + d_y];

        ctx.fillRect(
            cx + x - 1,
            cy + y - 1,
            2,
            2
        );

        pos = next;

        if (pos >= initialSize)
        {
            ctx.fillStyle = "#0f0";
        }
        else
        {
            ctx.fillStyle = "#f00";
        }
    } while (pos !== 0);
}


function drawLine()
{
    const cx = width >> 1;
    const cy = (height * GOLDEN)|0;

    let pos = 0;

    ctx.beginPath();

    const prev = data[d_prev]

    ctx.moveTo(
        cx + data[prev + d_x],
        cy + data[prev + d_y]
    )
    do
    {
        const next = data[pos + d_next];
        const x = data[pos + d_x];
        const y = data[pos + d_y];

        ctx.lineTo(
            cx + x,
            cy + y
        );

        pos = next;

    } while (pos !== 0);

    ctx.stroke();
}

function insertRandom()
{



    if (Math.random() < insertChance)
    {
        const choice = (Math.random() * end / d_size | 0) * d_size;
        const next = data[choice + d_next];

        const offset = end;
        end += d_size;

        const x0 = data[choice + d_x];
        const y0 = data[choice + d_y];
        const x1 = data[next + d_x];
        const y1 = data[next + d_y];

        data[choice + d_next] = offset;

        data[offset + d_prev] = choice;
        data[offset + d_next] = next;
        data[offset + d_x] = (x0 + x1) / 2;
        data[offset + d_y] = (y0 + y1) / 2;
        data[next + d_prev] = offset;
    }
}


let end = init();
const initialSize = end;



function movePoints()
{
    const neighbors = maxNum/2;
    const power = 0.2;
    const pushPower = 0.2;

    const maxDistance = 4;
    const minDistance = 50;

    for (let i = 0; i < end; i += d_size)
    {
        {
            // max distance to next in chain
            const next = data[i + d_next];
            const x0 = data[i + d_x];
            const y0 = data[i + d_y];
            const x1 = data[next + d_x];
            const y1 = data[next + d_y];

            const dx = x1 - x0;
            const dy = y1 - y0;

            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > maxDistance)
            {
                const f = power * (dist - maxDistance) / maxDistance;
                const inv = 1 / dist;

                data[i + d_x] += dx * inv * f;
                data[i + d_y] += dy * inv * f
                data[next + d_x] -= dx * inv * f;
                data[next + d_y] -= dy * inv * f
            }
        }

        {

            let x0 = data[i + d_x];
            let y0 = data[i + d_y];

            let prev = i;
            let next = i;
            for (let j = 0; j < neighbors; j++)
            {
                prev = data[prev + d_prev];
                next = data[next + d_next];

                const x1 = data[prev + d_x];
                const y1 = data[prev + d_y];
                const x2 = data[next + d_x];
                const y2 = data[next + d_y];

                let dx = x1 - x0;
                let dy = y1 - y0;

                let dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < minDistance)
                {
                    const f = pushPower * (minDistance - dist) / minDistance;
                    const inv = 1 / dist;

                    x0 -= dx * inv * f;
                    y0 -= dy * inv * f;
                    data[prev + d_x] += dx * inv * f;
                    data[prev + d_y] += dy * inv * f;
                }

                dx = x2 - x0;
                dy = y2 - y0;

                dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < minDistance)
                {
                    const f = pushPower * (minDistance - dist) / minDistance;
                    const inv = 1 / dist;

                    x0 -= dx * inv * f;
                    y0 -= dy * inv * f
                    data[next + d_x] += dx * inv * f;
                    data[next + d_y] += dy * inv * f;
                }

                if (prev === i || next === i)
                {
                    break;
                }

            }
            data[i + d_x] = x0;
            data[i + d_y] = y0 - 0.1;

        }
    }
}


// const color0 = Color.fromHSL(hue, 1, 0.3);
// const color1 = Color.fromHSL( hue + diff , 1, 0.5);
//
// console.log(color0.toRGBHex(), color1.toRGBHex())

let currentColor;

function main()
{

    //clearScreen();
    //drawPoints(initialSize);


    const numPoints = end / d_size;

    const tmp = Color.fromHSL(hue + numPoints/maxNum * hueStep, saturation, lightness)
    const col = tmp.toRGBA(0.2);
    if (col !== currentColor)
    {
        currentColor = col;
        ctx.strokeStyle = col;
    }

    movePoints();
    movePoints();
    movePoints();
    movePoints();

    drawLine();

    if (numPoints < maxNum)
    {
        insertRandom();
        insertRandom();
        insertRandom();
        insertRandom();
        raf(main);
    }
    else
    {
        window.setTimeout(
            () => {
                clearScreen();
                end = init();

                raf(main);
            },
            5000
        )

    }
}


canvas = document.getElementById("screen");
ctx = canvas.getContext("2d");

width = (window.innerWidth /*- 300*/) | 0;
height = (window.innerHeight) | 0;

config.width = width;
config.height = height;

canvas.width = width;
canvas.height = height;
clearScreen();

raf(main);
