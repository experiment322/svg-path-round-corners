// @flow
import {parse as importedParse} from './parse'
import type {TData, TDataCommand} from './types'

type TPoint = {x: number, y: number}

// Function for scaling vectors, keeping it's origin coordinates
const scaleVector = (p1: TPoint, p2: TPoint, factor: number): TPoint => {
    const {x: x1, y: y1} = p1
    const {x: x2, y: y2} = p2
    const x = x2 - x1
    const y = y2 - y1
    const dx = x - (x * factor)
    const dy = y - (y * factor)

    return {
        x: x2 - dx,
        y: y2 - dy,
    }
}

const makeBezierPoints = (p1: TPoint, p2: TPoint, p3: TPoint, radius: number) => {
    // Angle between lines
    const {PI, abs, sqrt, pow, acos, tan} = Math
    const {x: x1, y: y1} = p1
    const {x: x2, y: y2} = p2
    const {x: x3, y: y3} = p3
    const a = sqrt(pow(abs(x2 - x1), 2) + pow(abs(y2 - y1), 2))
    const b = sqrt(pow(abs(x3 - x2), 2) + pow(abs(y3 - y2), 2))
    const c = sqrt(pow(abs(x3 - x1), 2) + pow(abs(y3 - y1), 2))
    const angle = acos((pow(a, 2) + (pow(b, 2) - pow(c, 2))) / (2 * a * b)) // cos theoreme

    // Angle between any side and line from circle center to angle vertex
    const angle2 = (PI / 2) - (angle / 2)

    // Distance between angle vertex and point where circle touches any side
    const side = radius * tan(angle2)

    // How much new sides becomes shorter
    const aCoef = (a - side) / a
    const bCoef = (b - side) / b

    return [
        scaleVector(p1, p2, aCoef),
        scaleVector(p3, p2, bCoef),
    ]
}

const buildData = (path, radius) => {
    const result = []

    for (let i = 0; i < path.length; i += 1) {
        const p1 = path[i % path.length]
        const p2 = path[(i + 1) % path.length]
        const p3 = path[(i + 2) % path.length]

        const [c1, c2] = makeBezierPoints(p1, p2, p3, radius)

        if (i === 0) {
            result.push(
                ['M', c1.x, c1.y]
            )
        }

        result.push(
            ['L', c1.x, c1.y],
            ['Q', p2.x, p2.y, c2.x, c2.y], // bottom-left radius
        )
    }

    return result
}

export const getSubPaths = (d: TData): TData[] => {
    if (d.length === 0) {
        return []
    }
    else if (d[0].command !== 'M' && d[0].command !== 'm') {
        throw new Error(`Path must start with an "M" or "m" command, not "${d[0].command}" `)
    }

    const result = []
    let nextSubPath = []
    d.forEach((command) => {
        if (command === 'M' || command.command === 'm') {
            if (nextSubPath.length > 0) {
                result.push(nextSubPath)
            }
            nextSubPath = []
        }
        nextSubPath.push(command)
    })
    result.push(nextSubPath)

    return result
}

export const roundCorners = (d: TData, radius: number = 0): TData => {
    const subpathes = getSubPaths(d)
    let point = {x: 0, y: 0}

    const roundedSubPaths = subpathes.map((subpath: TData) => {

        // Move current point to the begining of a new path
        const firstCommand = subpath[0]
        if (firstCommand.command === 'M') {
            point = {x: firstCommand.x, y: firstCommand.y}
        }
        else if (firstCommand.command === 'm') {
            point = {x: point.x + firstCommand.dx, y: point.y + firstCommand.dy}
        }

        const result = [firstCommand]

        for (let i = 1; i < subpath.length; i++) {
            const command = subpath[i]
            if (i < subpath.length - 1) {
                const nextCommand = subpath[i + 1]
                if (command.command === 'L' && nextCommand.command === 'L') {
                    const p1 = point
                    const p2 = {x: command.x, y: command.y}
                    const p3 = {x: nextCommand.x, y: nextCommand.y}
                    const [q1, q2] = makeBezierPoints(p1, p2, p3, radius)
                    result.push({command: 'L', x: q1.x, y: q1.y})
                    result.push({command: 'Q', x1: p2.x, y1: p2.y, x: q2.x, y: q2.y})
                    result.push({command: 'L', x: p3.x, y: p3.y})
                    i++ // next command is already handled - skip it
                }
                else {
                    result.push(command)
                }
            }
            else {
                result.push(command)
            }
        }

        return result
    })

    return [].concat(...roundedSubPaths)

    /*

    const point = {x: 0, y: 0}
    const result = []
    for (let i = 0; i < d.length - 1; i++) {
        const command = d[i]
        const nextCommand = d[i + 1]
        let nextPoint = null

        if (command.command === 'M' || command.command === 'L' || command.command === 'C'
            || command.command === 'S' || command.command === 'Q' || command.command === 'T'
            || command.command === 'A') {
            nextPoint = {x: command.x, y: command.y}
        }
        else if (command.command === 'H') {
            nextPoint = {x: command.x, y: point.y}
        }
        else if (command.command === 'V') {
            nextPoint = {x: point.x, y: command.y}
        }
        else if (command.command === 'Z') {
            nextPoint = {x: point.x, y: command.y}
        }


        if (command.command === 'L') {

        }
        if (command.command === 'L') {
            // const p1 = {x: command.x1, y: command.y1}
            // const p2 = {x: command.x2, y: command.y2}
            // const p3 = {x: nextCommand.x1, y: command.y1}
            // makeBezierPoints({x: command.p1});
        }
        else if (command.command === 'M') {
            x = command.x
            y = command.y
        }
    }
    return result*/
}

// const data = buildData(path, radius / 2);
