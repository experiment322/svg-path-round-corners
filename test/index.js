// @flow
import test from 'tape'
import {parse} from '../src/parse'
import {serialize} from '../src/serialize'
import {roundCorners} from '../src/index'

//todo: test new lines

test('parse move command', (t) => {
    t.deepEquals(parse('M10 315'), [{command: 'M', x: 10, y: 315}])
    t.deepEquals(parse('M 10 315'), [{command: 'M', x: 10, y: 315}])
    t.deepEquals(parse('M10 315 43 17'), [{command: 'M', x: 10, y: 315}, {command: 'M', x: 43, y: 17}])
    t.deepEquals(parse('M 10 315 43 17 9 217'), [{command: 'M', x: 10, y: 315}, {command: 'M', x: 43, y: 17}, {command: 'M', x: 9, y: 217}])
    t.end()
})

test('bad move commands', (t) => {
    t.throws(() => parse('M 10 315 12'))
    t.end()
})

test('parse two moves command', (t) => {
    t.deepEquals(parse('M 10 315 M 78 35'), [{command: 'M', x: 10, y: 315}, {command: 'M', x: 78, y: 35}])
    t.end()
})

test('parse several commands with bezier curves', (t) => {
    t.deepEquals(parse('M100,200 C100,100 250,100 250,200 S400,300 400,200 z'), [
        {command: 'M', x: 100, y: 200},
        {command: 'C', x1: 100, y1: 100, x2: 250, y2: 100, x: 250, y: 200},
        {command: 'S', x2: 400, y2: 300, x: 400, y: 200},
        {command: 'z'},
    ])
    t.end()
})

test('parse command with negative coordinate', (t) => {
    t.deepEquals(parse('M10 -315 Z'), [{command: 'M', x: 10, y: -315}, {command: 'Z'}])
    t.deepEquals(parse('M -10 315 Z'), [{command: 'M', x: -10, y: 315}, {command: 'Z'}])
    t.deepEquals(parse('M-10 315 Z'), [{command: 'M', x: -10, y: 315}, {command: 'Z'}])
    t.deepEquals(parse('M 10-315 Z'), [{command: 'M', x: 10, y: -315}, {command: 'Z'}])
    t.deepEquals(parse('M-10-315 Z'), [{command: 'M', x: -10, y: -315}, {command: 'Z'}])
    t.deepEquals(parse('M -10 -315 Z'), [{command: 'M', x: -10, y: -315}, {command: 'Z'}])
    t.end()
})

test('parse command with decimal coordinate', (t) => {
    t.deepEquals(parse('M10.5 -315 Z'), [{command: 'M', x: 10.5, y: -315}, {command: 'Z'}])
    t.deepEquals(parse('M-10.5 -315 Z'), [{command: 'M', x: -10.5, y: -315}, {command: 'Z'}])
    t.end()
})

test('parse command with wrong coordinate format', (t) => {
    t.throws(() => parse('M10- Z'))
    t.throws(() => parse('M10--10 Z'))
    t.throws(() => parse('M10-- Z'))
    t.throws(() => parse('M-10.5.5 -315 Z'))
    t.end()
})

test('parse and serialize commands', (t) => {
    t.deepEquals(serialize(parse('M10 315')), 'M10 315')
    t.deepEquals(serialize(parse('M 10 315')), 'M10 315')
    t.deepEquals(serialize(parse('M 10-315')), 'M10-315')
    t.deepEquals(serialize(parse('M-10-315')), 'M-10-315')
    t.deepEquals(serialize(parse('M-10 -315')), 'M-10-315')
    t.deepEquals(serialize(parse('M -10 -315Z')), 'M-10-315Z')
    t.deepEquals(serialize(parse('M100,200 C100,100 250,100 250,200 S400,300 400,200 z')), 'M100 200C100 100 250 100 250 200S400 300 400 200z')
    t.end()
})

test('parse and serialize multiple same commands', (t) => {
    t.deepEquals(serialize(parse('M10 315 78 35Z')), 'M10 315 78 35Z')
    t.end()
})

test('round corners should do nothing when there are no double lines', (t) => {
    t.deepEquals(serialize(roundCorners(parse('M0 0C100 100 250 100 250 200S400 300 400 200z'))), 'M0 0C100 100 250 100 250 200S400 300 400 200z')
    t.deepEquals(serialize(roundCorners(parse('M0 0L100 0C100 100 250 100 250 200'))), 'M0 0L100 0C100 100 250 100 250 200')
    t.end()
})

test('round single corner', (t) => {
    t.deepEquals(serialize(roundCorners(parse('M0 0L100 0 100 100'), 30)), 'M0 0l70 0q30 0 30 30l0 70')
    t.deepEquals(serialize(roundCorners(parse('M50 30L150 30 150 130'), 30)), 'M50 30l70 0q30 0 30 30l0 70')
    t.end()
})

test('round single corner, use relative coordinates', (t) => {
    t.deepEquals(serialize(roundCorners(parse('M50 30l100 0 0 100'), 30)), 'M50 30l70 0q30 0 30 30l0 70')
    t.end()
})

test('two corners', (t) => {
    t.deepEquals(serialize(roundCorners(parse('M50 50l 100 0 0 100 -100 0'), 30)), 'M50 50l70 0q30 0 30 30l0 40q0 30-30 30l-70 0')
    t.end()
})

test('three corners', (t) => {
    t.deepEquals(serialize(roundCorners(parse('M50 50l 100 0 0 100 -100 0 0-50'), 30)), 'M50 50l70 0q30 0 30 30l0 40q0 30-30 30l-40 0q-30 0-30-30l0-20')
    t.end()
})

// test('combine lines with Z command', (t) => {
//     t.deepEquals(serialize(roundCorners(parse('M50 50l 100 0 0 100 -100 0Z'), 30)), 'M80 50l40 0q30 0 30 30l0 40q0 30-30 30l-40 0q-30 0-30 -30l0 -40q0 -30 30 -30')
//     t.end()
// })