import * as isObject from 'lodash/isObject'
import { fixCrazySan } from '../../utils/chessFormat'
import { Tree } from '../shared/tree'
import { AnalyseData } from '../../lichess/interfaces/analyse'
import { piotr2key } from './piotr'
import { SanToRole } from './interfaces'
import { Eval, NodeEvals } from './ceval/interfaces'

function isString(o: DestsMap | string): o is string {
  return typeof o === 'string'
}

function isDestMap(o: DestsMap | string): o is DestsMap {
  return isObject(o)
}

export function readDests(lines?: DestsMap | string): DestsMap | null {
  if (lines === undefined) return null
  if (isDestMap(lines)) return lines
  const dests: DestsMap = {}
  if (lines && isString(lines)) lines.split(' ').forEach(line => {
    dests[piotr2key[line[0]]] = line.split('').slice(1).map(c => piotr2key[c])
  })
  return dests
}

export function readDrops(line?: string | null): string[] | null {
  if (typeof line === 'undefined' || line === null) return null
  return line.match(/.{2}/g) || []
}

export function readCheckCount(fen: string) {
  const counts = fen.substr(fen.length - 4)
  return {
    white: parseInt(counts[3], 10),
    black: parseInt(counts[1], 10)
  }
}

export function empty(a?: any) {
  return !a || a.length === 0
}

export function renderEval(e: number) {
  e = Math.max(Math.min(Math.round(e / 10) / 10, 99), -99)
  return (e > 0 ? '+' : '') + e
}

const serverNodes = 4e6
export function getBestEval(evs: NodeEvals): Eval | undefined {
  const serverEv = evs.server, localEv = evs.client

  if (!serverEv) return localEv
  if (!localEv) return serverEv

  // Prefer localEv if it exeeds fishnet node limit or finds a better mate.
  if (localEv.nodes > serverNodes ||
    (typeof localEv.mate !== 'undefined' && (typeof serverEv.mate === 'undefined' || Math.abs(localEv.mate) < Math.abs(serverEv.mate))))
  return localEv

  return serverEv
}

export function isSynthetic(data: AnalyseData) {
  return data.game.id === 'synthetic'
}

export function autoScroll(movelist: HTMLElement | null) {
  if (!movelist) return
  requestAnimationFrame(() => {
    const plyEl = (movelist.querySelector('.current') || movelist.querySelector('turn:first-child')) as HTMLElement
    if (plyEl) {
      movelist.scrollTop = plyEl.offsetTop - movelist.offsetHeight / 2 + plyEl.offsetHeight / 2
    } else {
      movelist.scrollTop = 0
    }
  })
}

export const sanToRole: SanToRole = {
  P: 'pawn',
  N: 'knight',
  B: 'bishop',
  R: 'rook',
  Q: 'queen'
}

export function plyToTurn(ply: number): number {
  return Math.floor((ply - 1) / 2) + 1
}

export function nodeFullName(node: Tree.Node) {
  if (node.san) return plyToTurn(node.ply) + (
    node.ply % 2 === 1 ? '.' : '...'
  ) + ' ' + fixCrazySan(node.san)
  return 'Initial position'
}
