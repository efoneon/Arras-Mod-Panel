// ==UserScript==
// @name         Arras.io Mod Panel
// @namespace    https://github.com/efoneon/arras-mod-panel
// @version      2.0.0
// @description  Mod panel for arras.io with a customizable cursor reticle and auto-hold right-click for tank secondary abilities. Press \ to open the menu.
// @homepageURL  https://github.com/efoneon/arras-mod-panel
// @supportURL   https://github.com/efoneon/arras-mod-panel/issues
// @updateURL    https://github.com/efoneon/arras-mod-panel/raw/main/arras-mod-panel.user.js
// @downloadURL  https://github.com/efoneon/arras-mod-panel/raw/main/arras-mod-panel.user.js
// @author       efoneon
// @license      GPL-3.0-or-later
// @match        *://arras.io/*
// @match        *://*.arras.io/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

// Copyright (C) 2026 efoneon
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

;(function () {
  'use strict'

  const STORAGE_KEY = 'arrasModPanelSettings.v1'

  const defaults = {
    cursor: {
      enabled: true,
      color: '#ff2222',
      size: 8,
      opacity: 1,
      shape: 'dot', // 'dot' | 'ring' | 'crosshair'
      outline: true,
      outlineColor: '#000000',
      outlineWidth: 1,
    },
    autoSecondary: {
      enabled: false,
    },
    ui: {
      sections: {cursor: true, autoSecondary: true}, // collapsed state
    },
  }

  const deepMerge = (base, over) => {
    if (typeof base !== 'object' || base === null) return over ?? base
    const out = Array.isArray(base) ? [...base] : {...base}
    if (over && typeof over === 'object') {
      for (const k of Object.keys(over)) out[k] = deepMerge(base[k], over[k])
    }
    return out
  }

  const loadSettings = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return deepMerge(defaults, {})
      return deepMerge(defaults, JSON.parse(raw))
    } catch {
      return deepMerge(defaults, {})
    }
  }

  const saveSettings = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {}
  }

  const settings = loadSettings()

  // ------- Playing-state detection -------
  let isPlaying = false

  const isVisibleOverlay = el => {
    if (!el) return false
    const style = getComputedStyle(el)
    if (style.display === 'none' || style.visibility === 'hidden') return false
    if (parseFloat(style.opacity) === 0) return false
    const rect = el.getBoundingClientRect()
    return rect.width > 4 && rect.height > 4
  }

  const detectPlaying = () => {
    if (document.hidden || !document.hasFocus()) return false
    const canvas = document.querySelector('canvas')
    if (!canvas) return false

    const active = document.activeElement
    if (active) {
      const tag = active.tagName
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        active.isContentEditable
      ) {
        return false
      }
    }

    const inputs = document.querySelectorAll(
      'input[type="text"], input:not([type]), input[type="search"]'
    )
    for (const input of inputs) {
      if (isVisibleOverlay(input)) return false
    }

    return true
  }

  const cursorHideStyle = document.createElement('style')
  cursorHideStyle.textContent = `
    html.arras-mod-playing,
    html.arras-mod-playing body,
    html.arras-mod-playing canvas,
    html.arras-mod-playing * { cursor: none !important; }
    #arras-mod-menu, #arras-mod-menu * { cursor: auto !important; }
    #arras-mod-menu input[type="range"],
    #arras-mod-menu button,
    #arras-mod-menu select,
    #arras-mod-menu input[type="color"],
    #arras-mod-menu .arras-mod-section-header { cursor: pointer !important; }
  `
  document.documentElement.appendChild(cursorHideStyle)

  const updatePlayingState = () => {
    const next = detectPlaying()
    if (next !== isPlaying) {
      isPlaying = next
      document.documentElement.classList.toggle('arras-mod-playing', isPlaying)
      renderDot()
      updateAutoSecondary()
    }
  }

  // ------- Cursor reticle -------
  const dot = document.createElement('div')
  dot.id = 'arras-mod-cursor'
  Object.assign(dot.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    pointerEvents: 'none',
    zIndex: '2147483646',
    transform: 'translate(-50%, -50%)',
    willChange: 'transform, left, top',
    transition: 'none',
  })
  document.body.appendChild(dot)

  const renderDot = () => {
    const c = settings.cursor
    if (!c.enabled || !isPlaying) {
      dot.style.display = 'none'
      return
    }
    dot.style.display = 'block'
    dot.style.opacity = String(c.opacity)

    const size = Math.max(1, c.size)
    dot.style.width = `${size}px`
    dot.style.height = `${size}px`
    dot.style.borderRadius = '50%'
    dot.style.background = 'transparent'
    dot.style.boxShadow = 'none'
    dot.style.border = 'none'
    dot.style.filter = ''
    dot.innerHTML = ''

    const outline = c.outline
      ? `0 0 0 ${c.outlineWidth}px ${c.outlineColor}`
      : ''

    if (c.shape === 'dot') {
      dot.style.background = c.color
      if (outline) dot.style.boxShadow = outline
    } else if (c.shape === 'ring') {
      dot.style.border = `${Math.max(1, Math.round(size / 5))}px solid ${c.color}`
      if (outline) dot.style.boxShadow = `${outline}, inset ${outline}`
    } else if (c.shape === 'crosshair') {
      dot.style.borderRadius = '0'
      dot.style.width = `${size * 2 + 1}px`
      dot.style.height = `${size * 2 + 1}px`
      const stroke = Math.max(1, Math.round(size / 4))
      dot.innerHTML = `
        <svg viewBox="0 0 ${size * 2 + 1} ${size * 2 + 1}" width="100%" height="100%" style="display:block;overflow:visible">
          <line x1="${size + 0.5}" y1="0" x2="${size + 0.5}" y2="${size * 2 + 1}"
                stroke="${c.color}" stroke-width="${stroke}" />
          <line x1="0" y1="${size + 0.5}" x2="${size * 2 + 1}" y2="${size + 0.5}"
                stroke="${c.color}" stroke-width="${stroke}" />
          <circle cx="${size + 0.5}" cy="${size + 0.5}" r="${Math.max(1, Math.round(stroke / 1.5))}"
                  fill="${c.color}" />
        </svg>`
      if (c.outline) {
        dot.style.filter = `drop-shadow(0 0 ${c.outlineWidth}px ${c.outlineColor}) drop-shadow(0 0 ${c.outlineWidth}px ${c.outlineColor})`
      }
    }
  }

  let mouseX = window.innerWidth / 2
  let mouseY = window.innerHeight / 2
  let rafQueued = false

  const updateDotPosition = () => {
    rafQueued = false
    dot.style.left = `${mouseX}px`
    dot.style.top = `${mouseY}px`
  }

  window.addEventListener(
    'mousemove',
    e => {
      mouseX = e.clientX
      mouseY = e.clientY
      if (!rafQueued) {
        rafQueued = true
        requestAnimationFrame(updateDotPosition)
      }
    },
    {passive: true, capture: true}
  )

  // ------- Auto-hold right-click (tank secondary) -------
  // While enabled and playing, dispatch a synthetic right mousedown on the
  // game canvas, and re-dispatch it whenever the cursor moves. Release on
  // disable / pause / blur. Also suppress the context menu so right-click
  // doesn't pop the browser menu over the game.
  let autoSecondaryHeld = false

  const fireMouseEvent = (type, target) => {
    if (!target) return
    const evt = new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      view: window,
      button: 2,
      buttons: type === 'mouseup' ? 0 : 2,
      clientX: mouseX,
      clientY: mouseY,
    })
    target.dispatchEvent(evt)
  }

  const holdSecondary = () => {
    if (autoSecondaryHeld) return
    const canvas = document.querySelector('canvas')
    if (!canvas) return
    autoSecondaryHeld = true
    fireMouseEvent('mousedown', canvas)
  }

  const releaseSecondary = () => {
    if (!autoSecondaryHeld) return
    autoSecondaryHeld = false
    const canvas = document.querySelector('canvas')
    fireMouseEvent('mouseup', canvas)
  }

  const updateAutoSecondary = () => {
    if (settings.autoSecondary.enabled && isPlaying) holdSecondary()
    else releaseSecondary()
  }

  // Re-trigger mousedown on mousemove so games that re-poll on movement
  // continue to register the hold. Cheap; only runs when actively held.
  window.addEventListener(
    'mousemove',
    () => {
      if (!autoSecondaryHeld) return
      const canvas = document.querySelector('canvas')
      fireMouseEvent('mousedown', canvas)
    },
    {passive: true, capture: true}
  )

  // Suppress the browser context menu while auto-secondary is active so a
  // real right-click (or our synthetic one) doesn't open it.
  window.addEventListener(
    'contextmenu',
    e => {
      if (settings.autoSecondary.enabled && isPlaying) e.preventDefault()
    },
    true
  )

  window.addEventListener('blur', releaseSecondary)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) releaseSecondary()
  })

  // ------- Mod panel UI -------
  const menu = document.createElement('div')
  menu.id = 'arras-mod-menu'
  Object.assign(menu.style, {
    position: 'fixed',
    top: '12px',
    right: '12px',
    zIndex: '2147483647',
    background: 'rgba(20, 22, 28, 0.92)',
    color: '#f5f5f5',
    font: '13px/1.4 system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    padding: '12px 14px',
    borderRadius: '10px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
    border: '1px solid rgba(255,255,255,0.08)',
    width: '260px',
    userSelect: 'none',
    backdropFilter: 'blur(6px)',
  })

  const sectionHeaderStyle = `
    display:flex;align-items:center;justify-content:space-between;
    margin:6px -4px 4px;padding:4px 6px;border-radius:6px;
    background:rgba(255,255,255,0.04);
  `
  const inputBaseStyle =
    'background:#1c1f26;color:#fff;border:1px solid #333;border-radius:6px;padding:4px 6px;'

  menu.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
      <strong style="font-size:14px;letter-spacing:0.3px;">Arras Mod Panel</strong>
      <span style="font-size:11px;opacity:0.6;">\\ to toggle</span>
    </div>

    <div class="arras-mod-section-header" data-section="cursor" style="${sectionHeaderStyle}">
      <strong style="font-size:12px;">Cursor</strong>
      <span data-caret="cursor" style="opacity:0.7;">▾</span>
    </div>
    <div data-section-body="cursor">
      <label style="display:flex;align-items:center;gap:8px;margin:6px 0;">
        <input type="checkbox" data-key="cursor.enabled" /> <span>Enabled</span>
      </label>
      <label style="display:block;margin:8px 0 4px;">Shape</label>
      <select data-key="cursor.shape" style="width:100%;${inputBaseStyle}">
        <option value="dot">Dot</option>
        <option value="ring">Ring</option>
        <option value="crosshair">Crosshair</option>
      </select>
      <label style="display:flex;align-items:center;justify-content:space-between;margin:10px 0 4px;">
        <span>Color</span>
        <input type="color" data-key="cursor.color" style="width:48px;height:24px;border:none;background:none;padding:0;" />
      </label>
      <label style="display:block;margin:10px 0 2px;">Size: <span data-display="cursor.size"></span>px</label>
      <input type="range" min="1" max="40" step="1" data-key="cursor.size" style="width:100%;" />
      <label style="display:block;margin:8px 0 2px;">Opacity: <span data-display="cursor.opacity"></span></label>
      <input type="range" min="0.1" max="1" step="0.05" data-key="cursor.opacity" style="width:100%;" />
      <label style="display:flex;align-items:center;gap:8px;margin:10px 0 4px;">
        <input type="checkbox" data-key="cursor.outline" /> <span>Outline</span>
      </label>
      <div data-outline-controls>
        <label style="display:flex;align-items:center;justify-content:space-between;margin:6px 0 4px;">
          <span>Outline color</span>
          <input type="color" data-key="cursor.outlineColor" style="width:48px;height:24px;border:none;background:none;padding:0;" />
        </label>
        <label style="display:block;margin:6px 0 2px;">Outline width: <span data-display="cursor.outlineWidth"></span>px</label>
        <input type="range" min="1" max="6" step="1" data-key="cursor.outlineWidth" style="width:100%;" />
      </div>
    </div>

    <div class="arras-mod-section-header" data-section="autoSecondary" style="${sectionHeaderStyle}">
      <strong style="font-size:12px;">Auto Secondary Fire</strong>
      <span data-caret="autoSecondary" style="opacity:0.7;">▾</span>
    </div>
    <div data-section-body="autoSecondary">
      <label style="display:flex;align-items:center;gap:8px;margin:6px 0;">
        <input type="checkbox" data-key="autoSecondary.enabled" /> <span>Hold right-click automatically</span>
      </label>
      <p style="margin:6px 0;font-size:11px;opacity:0.65;line-height:1.4;">
        Continuously holds right-click while you're playing, triggering the
        secondary ability on tanks that use it (e.g. Smasher boost, Auto-Smasher,
        Landmine cloak, Predator zoom). Disable for tanks where right-click
        toggles a mode you don't want stuck on.
      </p>
    </div>
  `

  document.body.appendChild(menu)

  // Stop key/mouse events from reaching the game while interacting with the menu
  ;[
    'keydown',
    'keyup',
    'keypress',
    'mousedown',
    'mouseup',
    'click',
    'wheel',
    'contextmenu',
  ].forEach(ev => {
    menu.addEventListener(ev, e => e.stopPropagation(), true)
  })

  const getByPath = (obj, path) =>
    path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj)
  const setByPath = (obj, path, value) => {
    const keys = path.split('.')
    const last = keys.pop()
    const target = keys.reduce((o, k) => (o[k] ??= {}), obj)
    target[last] = value
  }

  const syncUiFromSettings = () => {
    menu.querySelectorAll('[data-key]').forEach(el => {
      const key = el.getAttribute('data-key')
      const value = getByPath(settings, key)
      if (el.type === 'checkbox') el.checked = !!value
      else el.value = value
    })
    menu.querySelectorAll('[data-display]').forEach(el => {
      const key = el.getAttribute('data-display')
      el.textContent = getByPath(settings, key)
    })
    menu.querySelector('[data-outline-controls]').style.display = settings
      .cursor.outline
      ? 'block'
      : 'none'

    for (const sec of Object.keys(settings.ui.sections)) {
      const open = settings.ui.sections[sec]
      const body = menu.querySelector(`[data-section-body="${sec}"]`)
      const caret = menu.querySelector(`[data-caret="${sec}"]`)
      if (body) body.style.display = open ? 'block' : 'none'
      if (caret) caret.textContent = open ? '▾' : '▸'
    }
  }

  menu.addEventListener('input', e => {
    const target = e.target
    const key = target.getAttribute && target.getAttribute('data-key')
    if (!key) return
    let value
    if (target.type === 'checkbox') value = target.checked
    else if (target.type === 'range' || target.type === 'number')
      value = parseFloat(target.value)
    else value = target.value
    setByPath(settings, key, value)
    saveSettings()
    syncUiFromSettings()
    renderDot()
    updateAutoSecondary()
  })

  menu.addEventListener('click', e => {
    const sectionHeader = e.target.closest('.arras-mod-section-header')
    if (sectionHeader) {
      const sec = sectionHeader.getAttribute('data-section')
      settings.ui.sections[sec] = !settings.ui.sections[sec]
      saveSettings()
      syncUiFromSettings()
      return
    }
  })

  let menuVisible = true
  const setMenuVisible = visible => {
    menuVisible = visible
    menu.style.display = visible ? 'block' : 'none'
  }

  const isToggleKey = e => e.key === '\\' || e.code === 'Backslash'

  const handleToggleKey = e => {
    const t = e.target
    const tag = t && t.tagName
    if (
      tag === 'INPUT' ||
      tag === 'TEXTAREA' ||
      tag === 'SELECT' ||
      (t && t.isContentEditable)
    ) {
      return
    }
    if (!isToggleKey(e)) return
    e.preventDefault()
    e.stopImmediatePropagation()
    if (e.repeat) return
    if (e.type === 'keydown') setMenuVisible(!menuVisible)
  }

  window.addEventListener('keydown', handleToggleKey, true)
  document.addEventListener('keydown', handleToggleKey, true)
  window.addEventListener('keyup', handleToggleKey, true)
  document.addEventListener('keyup', handleToggleKey, true)

  syncUiFromSettings()

  window.addEventListener('focus', updatePlayingState)
  window.addEventListener('blur', updatePlayingState)
  document.addEventListener('visibilitychange', updatePlayingState)
  document.addEventListener('focusin', updatePlayingState)
  document.addEventListener('focusout', updatePlayingState)
  setInterval(updatePlayingState, 400)

  isPlaying = detectPlaying()
  document.documentElement.classList.toggle('arras-mod-playing', isPlaying)
  renderDot()
  updateAutoSecondary()
})()
