import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'

import { configurator } from '../lib/configurator'
import { getCircumferenceMM, labelOfGemstoneType, totalPriceUSD } from '../lib/helpers'
import { useStore } from '../store'
import { BeadPreview } from '../three/BeadPreview'
import { GEM_TYPES, type BeadId, type GemType } from '../types'

// Keep GemType from widening to string when filtering
const notCarved = (g: GemType): g is Exclude<GemType, 'carved'> => g !== 'carved'
const GEM_OPTIONS = GEM_TYPES.filter(notCarved)

/* ---------------------------------- styles -------------------------------- */

const STYLES = [
  {
    id: 'classic',
    label: 'Classic',
    icon: (
      <svg viewBox="0 0 640 640">
        {' '}
        <path d="M320,133.83c-35.52,0-64.41-28.89-64.41-64.41S284.48,5.01,320,5.01s64.41,28.89,64.41,64.41-28.89,64.41-64.41,64.41ZM320,15.01c-30,0-54.41,24.41-54.41,54.41s24.41,54.41,54.41,54.41,54.41-24.41,54.41-54.41-24.41-54.41-54.41-54.41Z" />{' '}
        <path d="M320,634.99c-35.52,0-64.41-28.89-64.41-64.41s28.89-64.41,64.41-64.41,64.41,28.89,64.41,64.41-28.89,64.41-64.41,64.41ZM320,516.17c-30,0-54.41,24.41-54.41,54.41s24.41,54.41,54.41,54.41,54.41-24.41,54.41-54.41-24.41-54.41-54.41-54.41Z" />{' '}
        <path d="M194.81,167.42c-5.6,0-11.23-.74-16.78-2.22-16.62-4.45-30.51-15.11-39.11-30.01-8.6-14.9-10.89-32.26-6.43-48.87,4.45-16.62,15.11-30.51,30.01-39.11,30.76-17.76,70.23-7.18,87.98,23.58,8.6,14.9,10.89,32.26,6.43,48.87s-15.11,30.51-30.01,39.11c-9.92,5.73-20.94,8.66-32.1,8.66ZM194.62,48.59c-9.23,0-18.57,2.34-27.11,7.28-25.98,15-34.92,48.34-19.92,74.32,7.27,12.59,19,21.59,33.04,25.35,14.04,3.76,28.7,1.83,41.29-5.44,12.59-7.27,21.59-19,25.35-33.04,3.76-14.04,1.83-28.7-5.44-41.29-10.07-17.43-28.39-27.19-47.21-27.19Z" />{' '}
        <path d="M445.4,601.45c-5.6,0-11.23-.74-16.78-2.22-16.62-4.45-30.51-15.11-39.11-30.01-17.76-30.76-7.18-70.23,23.58-87.98,14.9-8.6,32.26-10.89,48.88-6.43,16.62,4.45,30.51,15.11,39.11,30.01h0c8.6,14.9,10.89,32.26,6.43,48.87s-15.11,30.51-30.01,39.11c-9.92,5.73-20.94,8.66-32.1,8.66ZM445.2,482.58c-9.43,0-18.73,2.47-27.12,7.31-25.98,15-34.92,48.34-19.92,74.32,7.27,12.59,19,21.59,33.04,25.35,14.04,3.76,28.7,1.83,41.29-5.44,12.59-7.27,21.59-19,25.35-33.04s1.83-28.7-5.44-41.29h0c-7.27-12.59-19-21.59-33.04-25.35-4.69-1.26-9.45-1.88-14.17-1.88Z" />{' '}
        <path d="M102.88,259.14c-11.16,0-22.17-2.93-32.1-8.66-30.76-17.76-41.33-57.23-23.58-87.98,8.6-14.9,22.49-25.56,39.11-30.01,16.62-4.45,33.98-2.17,48.87,6.43s25.56,22.49,30.01,39.11c4.45,16.62,2.17,33.98-6.43,48.87-8.6,14.9-22.49,25.56-39.11,30.01-5.55,1.49-11.18,2.22-16.77,2.22ZM103.08,140.31c-18.82,0-37.14,9.76-47.21,27.19-15,25.98-6.07,59.32,19.92,74.32,12.59,7.27,27.25,9.2,41.29,5.44,14.04-3.76,25.77-12.76,33.04-25.35s9.2-27.25,5.44-41.29c-3.76-14.04-12.76-25.77-25.35-33.04-8.55-4.93-17.89-7.28-27.11-7.28Z" />{' '}
        <path d="M536.91,509.73c-11.16,0-22.17-2.93-32.1-8.66-14.9-8.6-25.56-22.49-30.01-39.11s-2.17-33.98,6.43-48.88c17.76-30.76,57.23-41.33,87.98-23.58,14.9,8.6,25.56,22.49,30.01,39.11s2.17,33.98-6.43,48.88c-8.6,14.9-22.49,25.56-39.11,30.01-5.55,1.49-11.18,2.22-16.77,2.22ZM537.1,390.89c-18.82,0-37.14,9.76-47.21,27.19-7.27,12.59-9.2,27.25-5.44,41.29s12.76,25.77,25.35,33.04,27.25,9.2,41.29,5.44c14.04-3.76,25.77-12.76,33.04-25.35s9.2-27.25,5.44-41.29-12.76-25.77-25.35-33.04c-8.55-4.93-17.89-7.28-27.11-7.28Z" />{' '}
        <path d="M69.42,384.41c-35.52,0-64.41-28.89-64.41-64.41s28.89-64.41,64.41-64.41,64.41,28.89,64.41,64.41-28.89,64.41-64.41,64.41ZM69.42,265.59c-30,0-54.41,24.41-54.41,54.41s24.41,54.41,54.41,54.41,54.41-24.41,54.41-54.41-24.41-54.41-54.41-54.41Z" />{' '}
        <path d="M570.58,384.41c-35.51,0-64.41-28.89-64.41-64.41s28.89-64.41,64.41-64.41,64.41,28.89,64.41,64.41-28.89,64.41-64.41,64.41ZM570.58,265.59c-30,0-54.41,24.41-54.41,54.41s24.41,54.41,54.41,54.41,54.41-24.41,54.41-54.41-24.41-54.41-54.41-54.41Z" />{' '}
        <path d="M103.09,509.73c-5.6,0-11.23-.74-16.77-2.22-16.62-4.45-30.51-15.11-39.11-30.01-17.76-30.76-7.18-70.23,23.58-87.98s70.23-7.18,87.98,23.58c17.76,30.76,7.18,70.23-23.58,87.98-9.92,5.73-20.94,8.66-32.1,8.66ZM102.9,390.89c-9.23,0-18.57,2.34-27.11,7.28-25.98,15-34.92,48.34-19.92,74.32,7.27,12.59,19,21.59,33.04,25.35,14.04,3.76,28.7,1.83,41.29-5.44,25.98-15,34.92-48.34,19.92-74.32-10.07-17.43-28.39-27.19-47.21-27.19Z" />{' '}
        <path d="M537.12,259.14c-5.59,0-11.23-.74-16.77-2.22-16.62-4.45-30.51-15.11-39.11-30.01-8.6-14.9-10.89-32.26-6.43-48.87,4.45-16.62,15.11-30.51,30.01-39.11h0c14.9-8.6,32.26-10.89,48.87-6.43,16.62,4.45,30.51,15.11,39.11,30.01s10.89,32.26,6.43,48.87c-4.45,16.62-15.11,30.51-30.01,39.11-9.92,5.73-20.94,8.66-32.1,8.66ZM536.92,140.28c-9.43,0-18.73,2.47-27.12,7.31h0c-12.59,7.27-21.59,19-25.35,33.04-3.76,14.04-1.83,28.7,5.44,41.29s19,21.59,33.04,25.35c14.04,3.76,28.7,1.83,41.29-5.44,12.59-7.27,21.59-19,25.35-33.04,3.76-14.04,1.83-28.7-5.44-41.29-7.27-12.59-19-21.59-33.04-25.35-4.69-1.26-9.45-1.88-14.17-1.88Z" />{' '}
        <path d="M194.6,601.45c-11.16,0-22.17-2.93-32.1-8.66-14.9-8.6-25.56-22.49-30.01-39.11-4.45-16.62-2.17-33.98,6.43-48.87,8.6-14.9,22.49-25.56,39.11-30.01,16.62-4.45,33.98-2.17,48.87,6.43,14.9,8.6,25.56,22.49,30.01,39.11,4.45,16.62,2.17,33.97-6.43,48.87s-22.49,25.56-39.11,30.01c-5.55,1.49-11.18,2.22-16.77,2.22ZM194.8,482.58c-4.73,0-9.48.62-14.17,1.88-14.04,3.76-25.77,12.76-33.04,25.35h0c-7.27,12.59-9.2,27.25-5.44,41.29,3.76,14.04,12.76,25.77,25.35,33.04,12.59,7.27,27.25,9.2,41.29,5.44,14.04-3.76,25.77-12.76,33.04-25.35s9.2-27.25,5.44-41.29c-3.76-14.04-12.76-25.77-25.35-33.04-8.38-4.84-17.69-7.31-27.12-7.31Z" />{' '}
        <path d="M445.18,167.38c-10.92,0-21.98-2.77-32.1-8.62-30.76-17.76-41.33-57.23-23.58-87.98,17.76-30.76,57.23-41.33,87.98-23.58,14.9,8.6,25.56,22.49,30.01,39.11s2.17,33.98-6.43,48.87c-11.92,20.64-33.61,32.19-55.89,32.19ZM445.38,48.59c-18.82,0-37.14,9.76-47.21,27.19-15,25.98-6.07,59.32,19.92,74.32,25.98,15,59.32,6.07,74.32-19.92,7.27-12.59,9.2-27.25,5.44-41.29-3.76-14.04-12.76-25.77-25.35-33.04-8.55-4.93-17.89-7.28-27.11-7.28Z" />{' '}
      </svg>
    ),
  },
  {
    id: 'solitaire',
    label: 'Solitaire',
    icon: (
      <svg viewBox="0 0 640 640">
        {' '}
        <path d="M320,133.83c-35.52,0-64.41-28.89-64.41-64.41S284.48,5.01,320,5.01s64.41,28.89,64.41,64.41-28.89,64.41-64.41,64.41Z" />{' '}
        <path d="M320,634.99c-35.52,0-64.41-28.89-64.41-64.41s28.89-64.41,64.41-64.41,64.41,28.89,64.41,64.41-28.89,64.41-64.41,64.41ZM320,516.17c-30,0-54.41,24.41-54.41,54.41s24.41,54.41,54.41,54.41,54.41-24.41,54.41-54.41-24.41-54.41-54.41-54.41Z" />{' '}
        <path d="M194.81,167.42c-5.6,0-11.23-.74-16.78-2.22-16.62-4.45-30.51-15.11-39.11-30.01-8.6-14.9-10.89-32.26-6.43-48.87,4.45-16.62,15.11-30.51,30.01-39.11,30.76-17.76,70.23-7.18,87.98,23.58,8.6,14.9,10.89,32.26,6.43,48.87s-15.11,30.51-30.01,39.11c-9.92,5.73-20.94,8.66-32.1,8.66ZM194.62,48.59c-9.23,0-18.57,2.34-27.11,7.28-25.98,15-34.92,48.34-19.92,74.32,7.27,12.59,19,21.59,33.04,25.35,14.04,3.76,28.7,1.83,41.29-5.44,12.59-7.27,21.59-19,25.35-33.04,3.76-14.04,1.83-28.7-5.44-41.29-10.07-17.43-28.39-27.19-47.21-27.19Z" />{' '}
        <path d="M445.4,601.45c-5.6,0-11.23-.74-16.78-2.22-16.62-4.45-30.51-15.11-39.11-30.01-17.76-30.76-7.18-70.23,23.58-87.98,14.9-8.6,32.26-10.89,48.88-6.43,16.62,4.45,30.51,15.11,39.11,30.01h0c8.6,14.9,10.89,32.26,6.43,48.87s-15.11,30.51-30.01,39.11c-9.92,5.73-20.94,8.66-32.1,8.66ZM445.2,482.58c-9.43,0-18.73,2.47-27.12,7.31-25.98,15-34.92,48.34-19.92,74.32,7.27,12.59,19,21.59,33.04,25.35,14.04,3.76,28.7,1.83,41.29-5.44,12.59-7.27,21.59-19,25.35-33.04s1.83-28.7-5.44-41.29h0c-7.27-12.59-19-21.59-33.04-25.35-4.69-1.26-9.45-1.88-14.17-1.88Z" />{' '}
        <path d="M102.88,259.14c-11.16,0-22.17-2.93-32.1-8.66-30.76-17.76-41.33-57.23-23.58-87.98,8.6-14.9,22.49-25.56,39.11-30.01,16.62-4.45,33.98-2.17,48.87,6.43s25.56,22.49,30.01,39.11c4.45,16.62,2.17,33.98-6.43,48.87-8.6,14.9-22.49,25.56-39.11,30.01-5.55,1.49-11.18,2.22-16.77,2.22ZM103.08,140.31c-18.82,0-37.14,9.76-47.21,27.19-15,25.98-6.07,59.32,19.92,74.32,12.59,7.27,27.25,9.2,41.29,5.44,14.04-3.76,25.77-12.76,33.04-25.35s9.2-27.25,5.44-41.29c-3.76-14.04-12.76-25.77-25.35-33.04-8.55-4.93-17.89-7.28-27.11-7.28Z" />{' '}
        <path d="M536.91,509.73c-11.16,0-22.17-2.93-32.1-8.66-14.9-8.6-25.56-22.49-30.01-39.11s-2.17-33.98,6.43-48.88c17.76-30.76,57.23-41.33,87.98-23.58,14.9,8.6,25.56,22.49,30.01,39.11s2.17,33.98-6.43,48.88c-8.6,14.9-22.49,25.56-39.11,30.01-5.55,1.49-11.18,2.22-16.77,2.22ZM537.1,390.89c-18.82,0-37.14,9.76-47.21,27.19-7.27,12.59-9.2,27.25-5.44,41.29s12.76,25.77,25.35,33.04,27.25,9.2,41.29,5.44c14.04-3.76,25.77-12.76,33.04-25.35s9.2-27.25,5.44-41.29-12.76-25.77-25.35-33.04c-8.55-4.93-17.89-7.28-27.11-7.28Z" />{' '}
        <path d="M69.42,384.41c-35.52,0-64.41-28.89-64.41-64.41s28.89-64.41,64.41-64.41,64.41,28.89,64.41,64.41-28.89,64.41-64.41,64.41ZM69.42,265.59c-30,0-54.41,24.41-54.41,54.41s24.41,54.41,54.41,54.41,54.41-24.41,54.41-54.41-24.41-54.41-54.41-54.41Z" />{' '}
        <path d="M570.58,384.41c-35.51,0-64.41-28.89-64.41-64.41s28.89-64.41,64.41-64.41,64.41,28.89,64.41,64.41-28.89,64.41-64.41,64.41ZM570.58,265.59c-30,0-54.41,24.41-54.41,54.41s24.41,54.41,54.41,54.41,54.41-24.41,54.41-54.41-24.41-54.41-54.41-54.41Z" />{' '}
        <path d="M103.09,509.73c-5.6,0-11.23-.74-16.77-2.22-16.62-4.45-30.51-15.11-39.11-30.01-17.76-30.76-7.18-70.23,23.58-87.98s70.23-7.18,87.98,23.58c17.76,30.76,7.18,70.23-23.58,87.98-9.92,5.73-20.94,8.66-32.1,8.66ZM102.9,390.89c-9.23,0-18.57,2.34-27.11,7.28-25.98,15-34.92,48.34-19.92,74.32,7.27,12.59,19,21.59,33.04,25.35,14.04,3.76,28.7,1.83,41.29-5.44,25.98-15,34.92-48.34,19.92-74.32-10.07-17.43-28.39-27.19-47.21-27.19Z" />{' '}
        <path d="M537.12,259.14c-5.59,0-11.23-.74-16.77-2.22-16.62-4.45-30.51-15.11-39.11-30.01-8.6-14.9-10.89-32.26-6.43-48.87,4.45-16.62,15.11-30.51,30.01-39.11h0c14.9-8.6,32.26-10.89,48.87-6.43,16.62,4.45,30.51,15.11,39.11,30.01s10.89,32.26,6.43,48.87c-4.45,16.62-15.11,30.51-30.01,39.11-9.92,5.73-20.94,8.66-32.1,8.66ZM536.92,140.28c-9.43,0-18.73,2.47-27.12,7.31h0c-12.59,7.27-21.59,19-25.35,33.04-3.76,14.04-1.83,28.7,5.44,41.29s19,21.59,33.04,25.35c14.04,3.76,28.7,1.83,41.29-5.44,12.59-7.27,21.59-19,25.35-33.04,3.76-14.04,1.83-28.7-5.44-41.29-7.27-12.59-19-21.59-33.04-25.35-4.69-1.26-9.45-1.88-14.17-1.88Z" />{' '}
        <path d="M194.6,601.45c-11.16,0-22.17-2.93-32.1-8.66-14.9-8.6-25.56-22.49-30.01-39.11-4.45-16.62-2.17-33.98,6.43-48.87,8.6-14.9,22.49-25.56,39.11-30.01,16.62-4.45,33.98-2.17,48.87,6.43,14.9,8.6,25.56,22.49,30.01,39.11,4.45,16.62,2.17,33.97-6.43,48.87s-22.49,25.56-39.11,30.01c-5.55,1.49-11.18,2.22-16.77,2.22ZM194.8,482.58c-4.73,0-9.48.62-14.17,1.88-14.04,3.76-25.77,12.76-33.04,25.35h0c-7.27,12.59-9.2,27.25-5.44,41.29,3.76,14.04,12.76,25.77,25.35,33.04,12.59,7.27,27.25,9.2,41.29,5.44,14.04-3.76,25.77-12.76,33.04-25.35s9.2-27.25,5.44-41.29c-3.76-14.04-12.76-25.77-25.35-33.04-8.38-4.84-17.69-7.31-27.12-7.31Z" />{' '}
        <path d="M445.18,167.38c-10.92,0-21.98-2.77-32.1-8.62-30.76-17.76-41.33-57.23-23.58-87.98,17.76-30.76,57.23-41.33,87.98-23.58,14.9,8.6,25.56,22.49,30.01,39.11s2.17,33.98-6.43,48.87c-11.92,20.64-33.61,32.19-55.89,32.19ZM445.38,48.59c-18.82,0-37.14,9.76-47.21,27.19-15,25.98-6.07,59.32,19.92,74.32,25.98,15,59.32,6.07,74.32-19.92,7.27-12.59,9.2-27.25,5.44-41.29-3.76-14.04-12.76-25.77-25.35-33.04-8.55-4.93-17.89-7.28-27.11-7.28Z" />{' '}
      </svg>
    ),
  },
  {
    id: 'triad',
    label: 'Triad',
    icon: (
      <svg viewBox="0 0 629.98 629.98">
        {' '}
        <path d="M314.99,128.82c-35.52,0-64.41-28.89-64.41-64.41S279.48,0,314.99,0s64.41,28.89,64.41,64.41-28.89,64.41-64.41,64.41Z" />{' '}
        <path d="M314.99,629.98c-35.52,0-64.41-28.89-64.41-64.41s28.89-64.41,64.41-64.41,64.41,28.89,64.41,64.41-28.89,64.41-64.41,64.41ZM314.99,511.17c-30,0-54.41,24.41-54.41,54.41s24.41,54.41,54.41,54.41,54.41-24.41,54.41-54.41-24.41-54.41-54.41-54.41Z" />{' '}
        <path d="M189.81,162.42c-5.6,0-11.23-.74-16.78-2.22-16.62-4.45-30.51-15.11-39.11-30.01-8.6-14.9-10.89-32.26-6.43-48.87,4.45-16.62,15.11-30.51,30.01-39.11,30.76-17.76,70.23-7.18,87.98,23.58,8.6,14.9,10.89,32.26,6.43,48.87s-15.11,30.51-30.01,39.11c-9.92,5.73-20.94,8.66-32.1,8.66ZM189.61,43.58c-9.23,0-18.57,2.34-27.11,7.28-25.98,15-34.92,48.34-19.92,74.32,7.27,12.59,19,21.59,33.04,25.35,14.04,3.76,28.7,1.83,41.29-5.44,12.59-7.27,21.59-19,25.35-33.04,3.76-14.04,1.83-28.7-5.44-41.29-10.07-17.43-28.39-27.19-47.21-27.19Z" />{' '}
        <path d="M440.39,596.44c-5.6,0-11.23-.74-16.78-2.22-16.62-4.45-30.51-15.11-39.11-30.01-17.76-30.76-7.18-70.23,23.58-87.98,14.9-8.6,32.26-10.89,48.88-6.43,16.62,4.45,30.51,15.11,39.11,30.01h0c8.6,14.9,10.89,32.26,6.43,48.87s-15.11,30.51-30.01,39.11c-9.92,5.73-20.94,8.66-32.1,8.66ZM440.2,477.57c-9.43,0-18.73,2.47-27.12,7.31-25.98,15-34.92,48.34-19.92,74.32,7.27,12.59,19,21.59,33.04,25.35,14.04,3.76,28.7,1.83,41.29-5.44,12.59-7.27,21.59-19,25.35-33.04s1.83-28.7-5.44-41.29h0c-7.27-12.59-19-21.59-33.04-25.35-4.69-1.26-9.45-1.88-14.17-1.88Z" />{' '}
        <path d="M97.88,254.14c-11.16,0-22.17-2.93-32.1-8.66-30.76-17.76-41.33-57.23-23.58-87.98,8.6-14.9,22.49-25.56,39.11-30.01,16.62-4.45,33.98-2.17,48.87,6.43s25.56,22.49,30.01,39.11c4.45,16.62,2.17,33.98-6.43,48.87-8.6,14.9-22.49,25.56-39.11,30.01-5.55,1.49-11.18,2.22-16.77,2.22ZM98.07,135.3c-18.82,0-37.14,9.76-47.21,27.19-15,25.98-6.07,59.32,19.92,74.32,12.59,7.27,27.25,9.2,41.29,5.44,14.04-3.76,25.77-12.76,33.04-25.35s9.2-27.25,5.44-41.29c-3.76-14.04-12.76-25.77-25.35-33.04-8.55-4.93-17.89-7.28-27.11-7.28Z" />{' '}
        <path d="M531.9,504.72c-11.16,0-22.17-2.93-32.1-8.66-14.9-8.6-25.56-22.49-30.01-39.11s-2.17-33.98,6.43-48.88c17.76-30.76,57.23-41.33,87.98-23.58,14.9,8.6,25.56,22.49,30.01,39.11s2.17,33.98-6.43,48.88c-8.6,14.9-22.49,25.56-39.11,30.01-5.55,1.49-11.18,2.22-16.77,2.22Z" />{' '}
        <path d="M64.41,379.4c-35.52,0-64.41-28.89-64.41-64.41s28.89-64.41,64.41-64.41,64.41,28.89,64.41,64.41-28.89,64.41-64.41,64.41ZM64.41,260.58c-30,0-54.41,24.41-54.41,54.41s24.41,54.41,54.41,54.41,54.41-24.41,54.41-54.41-24.41-54.41-54.41-54.41Z" />{' '}
        <path d="M565.58,379.4c-35.51,0-64.41-28.89-64.41-64.41s28.89-64.41,64.41-64.41,64.41,28.89,64.41,64.41-28.89,64.41-64.41,64.41ZM565.58,260.58c-30,0-54.41,24.41-54.41,54.41s24.41,54.41,54.41,54.41,54.41-24.41,54.41-54.41-24.41-54.41-54.41-54.41Z" />{' '}
        <path d="M98.09,504.72c-5.6,0-11.23-.74-16.77-2.22-16.62-4.45-30.51-15.11-39.11-30.01-17.76-30.76-7.18-70.23,23.58-87.98s70.23-7.18,87.98,23.58c17.76,30.76,7.18,70.23-23.58,87.98-9.92,5.73-20.94,8.66-32.1,8.66Z" />{' '}
        <path d="M532.11,254.14c-5.59,0-11.23-.74-16.77-2.22-16.62-4.45-30.51-15.11-39.11-30.01-8.6-14.9-10.89-32.26-6.43-48.87,4.45-16.62,15.11-30.51,30.01-39.11h0c14.9-8.6,32.26-10.89,48.87-6.43,16.62,4.45,30.51,15.11,39.11,30.01s10.89,32.26,6.43,48.87c-4.45,16.62-15.11,30.51-30.01,39.11-9.92,5.73-20.94,8.66-32.1,8.66ZM531.92,135.27c-9.43,0-18.73,2.47-27.12,7.31h0c-12.59,7.27-21.59,19-25.35,33.04-3.76,14.04-1.83,28.7,5.44,41.29s19,21.59,33.04,25.35c14.04,3.76,28.7,1.83,41.29-5.44,12.59-7.27,21.59-19,25.35-33.04,3.76-14.04,1.83-28.7-5.44-41.29-7.27-12.59-19-21.59-33.04-25.35-4.69-1.26-9.45-1.88-14.17-1.88Z" />{' '}
        <path d="M189.6,596.44c-11.16,0-22.17-2.93-32.1-8.66-14.9-8.6-25.56-22.49-30.01-39.11-4.45-16.62-2.17-33.98,6.43-48.87,8.6-14.9,22.49-25.56,39.11-30.01,16.62-4.45,33.98-2.17,48.87,6.43,14.9,8.6,25.56,22.49,30.01,39.11,4.45,16.62,2.17,33.97-6.43,48.87s-22.49,25.56-39.11,30.01c-5.55,1.49-11.18,2.22-16.77,2.22ZM189.79,477.57c-4.73,0-9.48.62-14.17,1.88-14.04,3.76-25.77,12.76-33.04,25.35h0c-7.27,12.59-9.2,27.25-5.44,41.29,3.76,14.04,12.76,25.77,25.35,33.04,12.59,7.27,27.25,9.2,41.29,5.44,14.04-3.76,25.77-12.76,33.04-25.35s9.2-27.25,5.44-41.29c-3.76-14.04-12.76-25.77-25.35-33.04-8.38-4.84-17.69-7.31-27.12-7.31Z" />{' '}
        <path d="M440.18,162.38c-10.92,0-21.98-2.77-32.1-8.62-30.76-17.76-41.33-57.23-23.58-87.98,17.76-30.76,57.23-41.33,87.98-23.58,14.9,8.6,25.56,22.49,30.01,39.11s2.17,33.98-6.43,48.87c-11.92,20.64-33.61,32.19-55.89,32.19ZM440.38,43.58c-18.82,0-37.14,9.76-47.21,27.19-15,25.98-6.07,59.32,19.92,74.32,25.98,15,59.32,6.07,74.32-19.92,7.27-12.59,9.2-27.25,5.44-41.29-3.76-14.04-12.76-25.77-25.35-33.04-8.55-4.93-17.89-7.28-27.11-7.28Z" />{' '}
      </svg>
    ),
  },
  {
    id: 'array',
    label: 'Array',
    icon: (
      <svg viewBox="0 0 629.98 629.98">
        {' '}
        <path d="M314.99,128.82c-35.52,0-64.41-28.89-64.41-64.41S279.48,0,314.99,0s64.41,28.89,64.41,64.41-28.89,64.41-64.41,64.41Z" />{' '}
        <path d="M314.99,629.98c-35.52,0-64.41-28.89-64.41-64.41s28.89-64.41,64.41-64.41,64.41,28.89,64.41,64.41-28.89,64.41-64.41,64.41ZM314.99,511.17c-30,0-54.41,24.41-54.41,54.41s24.41,54.41,54.41,54.41,54.41-24.41,54.41-54.41-24.41-54.41-54.41-54.41Z" />{' '}
        <path d="M189.81,162.42c-5.6,0-11.23-.74-16.78-2.22-16.62-4.45-30.51-15.11-39.11-30.01-8.6-14.9-10.89-32.26-6.43-48.87,4.45-16.62,15.11-30.51,30.01-39.11,30.76-17.76,70.23-7.18,87.98,23.58,8.6,14.9,10.89,32.26,6.43,48.87s-15.11,30.51-30.01,39.11c-9.92,5.73-20.94,8.66-32.1,8.66Z" />{' '}
        <path d="M440.39,596.44c-5.6,0-11.23-.74-16.78-2.22-16.62-4.45-30.51-15.11-39.11-30.01-17.76-30.76-7.18-70.23,23.58-87.98,14.9-8.6,32.26-10.89,48.88-6.43,16.62,4.45,30.51,15.11,39.11,30.01h0c8.6,14.9,10.89,32.26,6.43,48.87s-15.11,30.51-30.01,39.11c-9.92,5.73-20.94,8.66-32.1,8.66ZM440.2,477.57c-9.43,0-18.73,2.47-27.12,7.31-25.98,15-34.92,48.34-19.92,74.32,7.27,12.59,19,21.59,33.04,25.35,14.04,3.76,28.7,1.83,41.29-5.44,12.59-7.27,21.59-19,25.35-33.04s1.83-28.7-5.44-41.29h0c-7.27-12.59-19-21.59-33.04-25.35-4.69-1.26-9.45-1.88-14.17-1.88Z" />{' '}
        <path d="M97.88,254.14c-11.16,0-22.17-2.93-32.1-8.66-30.76-17.76-41.33-57.23-23.58-87.98,8.6-14.9,22.49-25.56,39.11-30.01,16.62-4.45,33.98-2.17,48.87,6.43s25.56,22.49,30.01,39.11c4.45,16.62,2.17,33.98-6.43,48.87-8.6,14.9-22.49,25.56-39.11,30.01-5.55,1.49-11.18,2.22-16.77,2.22Z" />{' '}
        <path d="M531.9,504.72c-11.16,0-22.17-2.93-32.1-8.66-14.9-8.6-25.56-22.49-30.01-39.11s-2.17-33.98,6.43-48.88c17.76-30.76,57.23-41.33,87.98-23.58,14.9,8.6,25.56,22.49,30.01,39.11s2.17,33.98-6.43,48.88c-8.6,14.9-22.49,25.56-39.11,30.01-5.55,1.49-11.18,2.22-16.77,2.22ZM532.1,385.89c-18.82,0-37.14,9.76-47.21,27.19-7.27,12.59-9.2,27.25-5.44,41.29s12.76,25.77,25.35,33.04,27.25,9.2,41.29,5.44c14.04-3.76,25.77-12.76,33.04-25.35s9.2-27.25,5.44-41.29-12.76-25.77-25.35-33.04c-8.55-4.93-17.89-7.28-27.11-7.28Z" />{' '}
        <path d="M64.41,379.4c-35.52,0-64.41-28.89-64.41-64.41s28.89-64.41,64.41-64.41,64.41,28.89,64.41,64.41-28.89,64.41-64.41,64.41ZM64.41,260.58c-30,0-54.41,24.41-54.41,54.41s24.41,54.41,54.41,54.41,54.41-24.41,54.41-54.41-24.41-54.41-54.41-54.41Z" />{' '}
        <path d="M565.58,379.4c-35.51,0-64.41-28.89-64.41-64.41s28.89-64.41,64.41-64.41,64.41,28.89,64.41,64.41-28.89,64.41-64.41,64.41ZM565.58,260.58c-30,0-54.41,24.41-54.41,54.41s24.41,54.41,54.41,54.41,54.41-24.41,54.41-54.41-24.41-54.41-54.41-54.41Z" />{' '}
        <path d="M98.09,504.72c-5.6,0-11.23-.74-16.77-2.22-16.62-4.45-30.51-15.11-39.11-30.01-17.76-30.76-7.18-70.23,23.58-87.98s70.23-7.18,87.98,23.58c17.76,30.76,7.18,70.23-23.58,87.98-9.92,5.73-20.94,8.66-32.1,8.66ZM97.89,385.89c-9.23,0-18.57,2.34-27.11,7.28-25.98,15-34.92,48.34-19.92,74.32,7.27,12.59,19,21.59,33.04,25.35,14.04,3.76,28.7,1.83,41.29-5.44,25.98-15,34.92-48.34,19.92-74.32-10.07-17.43-28.39-27.19-47.21-27.19Z" />{' '}
        <path d="M532.11,254.14c-5.59,0-11.23-.74-16.77-2.22-16.62-4.45-30.51-15.11-39.11-30.01-8.6-14.9-10.89-32.26-6.43-48.87,4.45-16.62,15.11-30.51,30.01-39.11h0c14.9-8.6,32.26-10.89,48.87-6.43,16.62,4.45,30.51,15.11,39.11,30.01s10.89,32.26,6.43,48.87c-4.45,16.62-15.11,30.51-30.01,39.11-9.92,5.73-20.94,8.66-32.1,8.66Z" />{' '}
        <path d="M189.6,596.44c-11.16,0-22.17-2.93-32.1-8.66-14.9-8.6-25.56-22.49-30.01-39.11-4.45-16.62-2.17-33.98,6.43-48.87,8.6-14.9,22.49-25.56,39.11-30.01,16.62-4.45,33.98-2.17,48.87,6.43,14.9,8.6,25.56,22.49,30.01,39.11,4.45,16.62,2.17,33.97-6.43,48.87s-22.49,25.56-39.11,30.01c-5.55,1.49-11.18,2.22-16.77,2.22ZM189.79,477.57c-4.73,0-9.48.62-14.17,1.88-14.04,3.76-25.77,12.76-33.04,25.35h0c-7.27,12.59-9.2,27.25-5.44,41.29,3.76,14.04,12.76,25.77,25.35,33.04,12.59,7.27,27.25,9.2,41.29,5.44,14.04-3.76,25.77-12.76,33.04-25.35s9.2-27.25,5.44-41.29c-3.76-14.04-12.76-25.77-25.35-33.04-8.38-4.84-17.69-7.31-27.12-7.31Z" />{' '}
        <path d="M440.18,162.38c-10.92,0-21.98-2.77-32.1-8.62-30.76-17.76-41.33-57.23-23.58-87.98,17.76-30.76,57.23-41.33,87.98-23.58,14.9,8.6,25.56,22.49,30.01,39.11s2.17,33.98-6.43,48.87c-11.92,20.64-33.61,32.19-55.89,32.19Z" />{' '}
      </svg>
    ),
  },
] as const
type Style = (typeof STYLES)[number]

/* ------------------------------ focal options ----------------------------- */

type Focal = { id: BeadId; label: string; beads: BeadId[] }

const SOLITAIRE_OPTIONS: Focal[] = [
  {
    id: 'lava-cube-10',
    label: 'Lava Stone',
    beads: ['spacer-10x2', 'lava-cube-10', 'spacer-10x2'],
  },
  {
    id: 'cube-black-logo-10',
    label: 'Black Metal Signature',
    beads: ['spacer-10x2', 'cube-black-logo-10', 'spacer-10x2'],
  },
  {
    id: 'cube-stainless-logo-10',
    label: 'Stainless Steel Signature',
    beads: ['spacer-10x2', 'cube-stainless-logo-10', 'spacer-10x2'],
  },
  {
    id: 'cube-dullsteel-logo-10',
    label: 'Matte Steel Signature',
    beads: ['spacer-10x2', 'cube-dullsteel-logo-10', 'spacer-10x2'],
  },
  {
    id: 'cube-brass-logo-10',
    label: 'Brass Signature',
    beads: ['spacer-10x2', 'cube-brass-logo-10', 'spacer-10x2'],
  },
]

const TRIAD_OPTIONS: Focal[] = [
  { id: 'lava-cube-8', label: 'Lava Stone', beads: ['spacer-8x2', 'lava-cube-8', 'spacer-8x2'] },
  { id: 'carved-10', label: 'Carved Obsidian', beads: ['spacer-8x2', 'carved-10', 'spacer-8x2'] },
  { id: 'tigereye-10', label: 'Tiger Eye', beads: ['spacer-8x2', 'tigereye-10', 'spacer-8x2'] },
  { id: 'bronzite-10', label: 'Bronzite', beads: ['spacer-8x2', 'bronzite-10', 'spacer-8x2'] },
  { id: 'malachite-10', label: 'Malachite', beads: ['spacer-8x2', 'malachite-10', 'spacer-8x2'] },
  { id: 'mapstone-10', label: 'Map Stone', beads: ['spacer-8x2', 'mapstone-10', 'spacer-8x2'] },
]

const ARRAY_OPTIONS: Focal[] = [
  {
    id: 'bronzite-10',
    label: 'Bronzite',
    beads: [
      'spacer-8x2',
      'bronzite-10',
      'bronzite-10',
      'bronzite-10',
      'bronzite-10',
      'bronzite-10',
      'spacer-8x2',
    ],
  },
  {
    id: 'onyx-10',
    label: 'Onyx',
    beads: ['spacer-8x2', 'onyx-10', 'onyx-10', 'onyx-10', 'onyx-10', 'onyx-10', 'spacer-8x2'],
  },
  {
    id: 'larvikite-10',
    label: 'Larvikite',
    beads: [
      'spacer-8x2',
      'larvikite-10',
      'larvikite-10',
      'larvikite-10',
      'larvikite-10',
      'larvikite-10',
      'spacer-8x2',
    ],
  },
  {
    id: 'malachite-10',
    label: 'Malachite',
    beads: [
      'spacer-8x2',
      'malachite-10',
      'malachite-10',
      'malachite-10',
      'malachite-10',
      'malachite-10',
      'spacer-8x2',
    ],
  },
  {
    id: 'mapstone-10',
    label: 'Map Stone',
    beads: [
      'spacer-8x2',
      'mapstone-10',
      'mapstone-10',
      'mapstone-10',
      'mapstone-10',
      'mapstone-10',
      'spacer-8x2',
    ],
  },
  {
    id: 'quartz-10',
    label: 'Quartz',
    beads: [
      'spacer-8x2',
      'quartz-10',
      'quartz-10',
      'quartz-10',
      'quartz-10',
      'quartz-10',
      'spacer-8x2',
    ],
  },
  {
    id: 'rubyinzoisite-10',
    label: 'Ruby in Zoisite',
    beads: [
      'spacer-8x2',
      'rubyinzoisite-10',
      'rubyinzoisite-10',
      'rubyinzoisite-10',
      'rubyinzoisite-10',
      'rubyinzoisite-10',
      'spacer-8x2',
    ],
  },
  {
    id: 'tigereye-10',
    label: 'Tiger Eye',
    beads: [
      'spacer-8x2',
      'tigereye-10',
      'tigereye-10',
      'tigereye-10',
      'tigereye-10',
      'tigereye-10',
      'spacer-8x2',
    ],
  },
  {
    id: 'whitejade-10',
    label: 'White Jade',
    beads: [
      'spacer-8x2',
      'whitejade-10',
      'whitejade-10',
      'whitejade-10',
      'whitejade-10',
      'whitejade-10',
      'spacer-8x2',
    ],
  },
]

/* ------------------------------ size options ------------------------------ */

const TARGET_SIZES = [
  { sizeMM: 165.1, label: '6.5"' },
  { sizeMM: 171.45, label: '6.75"' },
  { sizeMM: 177.8, label: '7"' },
  { sizeMM: 184.15, label: '7.25"' },
  { sizeMM: 190.5, label: '7.5"' },
  { sizeMM: 196.85, label: '7.75"' },
  { sizeMM: 203.2, label: '8"' },
  { sizeMM: 209.55, label: '8.25"' },
  { sizeMM: 215.9, label: '8.5"' },
] as const
type TargetSize = (typeof TARGET_SIZES)[number]

/* ------------------------------- SelectItem ------------------------------- */

type BaseProps<T> = {
  label: string
  options: T[]
  /** How to display a non-null option. If it returns undefined, we fallback to String(opt). */
  getLabel?: (opt: T) => string | undefined
  /** Custom equality (useful for objects/arrays). Default: Object.is */
  equals?: (a: T | null, b: T | null) => boolean
  /** Stable key for each option. Default: String(opt) or index fallback */
  toKey?: (opt: T | null, index: number) => React.Key
  /** Used when nullable: false and value is null (shouldn’t usually happen) */
  placeholder?: string
  disabled?: boolean
  className?: string
  renderOption?: (opt: T | null, selected: boolean) => React.ReactNode
  getBeadId?: (opt: T | null) => BeadId | ''
}

type NullableProps<T> = BaseProps<T> & {
  nullable: true
  value: T | null
  onChange: (next: T | null) => void
  /** Trigger text when value === null */
  emptyLabel: string
  /** Menu label for the injected null option */
  emptyOptionLabel: string
}

type NonNullableProps<T> = BaseProps<T> & {
  nullable?: false
  value: T
  onChange: (next: T) => void
  emptyLabel?: never
  emptyOptionLabel?: never
}

export type SelectItemProps<T> = NullableProps<T> | NonNullableProps<T>

export function SelectItem<T>(props: SelectItemProps<T>) {
  const {
    label,
    options,
    getLabel,
    equals = Object.is,
    toKey,
    placeholder = 'Select…',
    disabled = false,
    className = '',
    renderOption,
    getBeadId,
    value,
    nullable,
  } = props

  const isNullable = nullable === true

  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const id = useId()

  const handleButtonClick = useCallback(() => {
    if (!disabled) setOpen((p) => !p)
  }, [disabled])

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node
      if (!btnRef.current?.contains(t) && !listRef.current?.contains(t)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  // Only inject a null option when nullable
  const listOptions: (T | null)[] = useMemo(
    () => (isNullable ? [null, ...options] : options.slice()),
    [isNullable, options]
  )

  const defaultKey = (opt: T | null, index: number): React.Key => {
    if (opt === null) return 'null'
    const s = String(opt)
    return s === '[object Object]' ? index : s
  }

  const labelFor = (opt: T | null): string => {
    if (opt == null) {
      return isNullable ? (props as NullableProps<T>).emptyOptionLabel : ''
    }
    const lbl = getLabel?.(opt)
    return lbl ?? String(opt)
  }

  const triggerText =
    value == null
      ? isNullable
        ? (props as NullableProps<T>).emptyLabel
        : placeholder
      : labelFor(value)

  const onChangeNullable = isNullable ? (props as NullableProps<T>).onChange : undefined
  const onChangeNonNull = !isNullable ? (props as NonNullableProps<T>).onChange : undefined

  const change = useCallback(
    (opt: T | null) => {
      if (isNullable) {
        onChangeNullable?.(opt)
      } else {
        onChangeNonNull?.(opt as T)
      }
    },
    [isNullable, onChangeNullable, onChangeNonNull]
  )

  const getCurrentIndex = useCallback(() => {
    if (listOptions.length === 0) return -1
    const idx = listOptions.findIndex((opt) => equals(value as T | null, opt as T | null))
    return idx >= 0 ? idx : 0
  }, [listOptions, equals, value])

  const cycle = useCallback(
    (delta: number) => {
      if (disabled || listOptions.length === 0) return
      const cur = getCurrentIndex()
      if (cur < 0) return
      const len = listOptions.length
      const next = (((cur + delta) % len) + len) % len // safe modulo
      change(listOptions[next])
      // keep menu state as-is; return focus to main trigger for accessibility
      btnRef.current?.focus()
    },
    [disabled, listOptions, getCurrentIndex, change]
  )

  const canCycle = !disabled && listOptions.length > 0

  const selectionBeadId = getBeadId ? getBeadId(value) : ''

  return (
    <div className={`select-item ${open ? 'open' : ''} ${className}`}>
      <div className="select-main">
        <div className="selection">
          {selectionBeadId ? <BeadPreview beadId={selectionBeadId} size={96} /> : null}
          <div className="text">
            <div className="select-item__label">{label}</div>
            <div className="select-item__name">{triggerText}</div>
          </div>
        </div>
        <div className="select-item-buttons">
          <button
            className="select-item-button"
            type="button"
            aria-label="Previous option"
            title="Previous"
            onClick={() => cycle(-1)}
            disabled={!canCycle}
          >
            <svg aria-hidden viewBox="0 0 20 20" width="16" height="16">
              <path d="M13 5l-6 5 6 5" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>

          <button
            className="select-item-button"
            ref={btnRef}
            type="button"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={`${id}-listbox`}
            onClick={handleButtonClick}
            disabled={disabled}
            title="Open menu"
          >
            <svg aria-hidden viewBox="0 0 20 20" width="16" height="16">
              <rect x="2" y="2" width="4" height="4" fill="currentColor" />
              <rect x="8" y="2" width="4" height="4" fill="currentColor" />
              <rect x="14" y="2" width="4" height="4" fill="currentColor" />
              <rect x="2" y="8" width="4" height="4" fill="currentColor" />
              <rect x="8" y="8" width="4" height="4" fill="currentColor" />
              <rect x="14" y="8" width="4" height="4" fill="currentColor" />
              <rect x="2" y="14" width="4" height="4" fill="currentColor" />
              <rect x="8" y="14" width="4" height="4" fill="currentColor" />
              <rect x="14" y="14" width="4" height="4" fill="currentColor" />
            </svg>
          </button>

          <button
            className="select-item-button"
            type="button"
            aria-label="Next option"
            title="Next"
            onClick={() => cycle(1)}
            disabled={!canCycle}
          >
            <svg aria-hidden viewBox="0 0 20 20" width="16" height="16">
              <path d="M7 5l6 5-6 5" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div
          ref={listRef}
          id={`${id}-listbox`}
          role="listbox"
          className="options"
          aria-labelledby={`${id}-label`}
        >
          {listOptions.map((opt, i) => {
            const beadId = getBeadId ? getBeadId(opt) : ''
            const selected = equals(value as T | null, opt as T | null)
            return (
              <button
                type="button"
                key={(toKey ?? defaultKey)(opt, i)}
                role="option"
                aria-selected={selected}
                onClick={() => {
                  change(opt)
                  setOpen(false)
                  btnRef.current?.focus()
                }}
                className={`list-option small${selected ? ' selected' : ''}`}
              >
                <BeadPreview beadId={beadId} size={96} />
                {renderOption ? renderOption(opt, selected) : labelFor(opt)}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* -------------------------------- Controls -------------------------------- */

export const Controls = () => {
  const bracelet = useStore((state) => state.bracelet)
  const setBracelet = useStore((state) => state.setBracelet)

  const [targetCircumferenceMM, setTargetCircumferenceMM] = useState<TargetSize>(TARGET_SIZES[2])
  const [primary, setPrimary] = useState<GemType>('onyx')
  const [secondary, setSecondary] = useState<GemType | null>(null)
  const [style, setStyle] = useState<Style>(STYLES[0])
  const [solitaireFocal, setSolitaireFocal] = useState<Focal>(SOLITAIRE_OPTIONS[0])
  const [arrayFocal, setArrayFocal] = useState<Focal>(ARRAY_OPTIONS[0])
  const [triadFocal, setTriadFocal] = useState<Focal>(TRIAD_OPTIONS[0])
  const [spacers, setSpacers] = useState(false)

  const circumference = useMemo(() => {
    const circumferenceMM = getCircumferenceMM(bracelet)
    return {
      mm: circumferenceMM,
      in: (circumferenceMM * (1 / 25.4)).toFixed(1),
    }
  }, [bracelet])

  // Run configurator whenever controls change
  useEffect(() => {
    const newBracelet = configurator({
      targetCircumferenceMM: targetCircumferenceMM.sizeMM,
      primary,
      mainSizeMM: 10,
      secondary: style.id !== 'array' ? (secondary ?? undefined) : undefined,
      spacers,
      focal:
        style.id === 'solitaire'
          ? solitaireFocal.beads
          : style.id === 'triad'
            ? triadFocal.beads
            : style.id === 'array'
              ? arrayFocal.beads
              : undefined,
      triad: style.id === 'triad',
    })
    setBracelet(newBracelet)
  }, [
    targetCircumferenceMM,
    primary,
    secondary,
    solitaireFocal,
    triadFocal,
    arrayFocal,
    spacers,
    setBracelet,
    style,
  ])

  return (
    <div className="side-inner">
      <div className="main">
        <div className="grid">
          <div className="option-item">
            <div className="options styles">
              {STYLES.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setStyle(opt)}
                  className={`btn small${style === opt ? ' primary' : ''}`}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>

            {style.id === 'solitaire' ? (
              <SelectItem
                label="Solitaire Focal"
                value={solitaireFocal}
                onChange={setSolitaireFocal}
                options={SOLITAIRE_OPTIONS}
                getLabel={(opt) => opt.label}
                getBeadId={(opt) => (opt ? opt.id : '')}
              />
            ) : null}

            {style.id === 'triad' ? (
              <SelectItem
                label="Triad Focal"
                value={triadFocal}
                onChange={setTriadFocal}
                options={TRIAD_OPTIONS}
                getLabel={(opt) => opt.label}
                getBeadId={(opt) => (opt ? opt.id : '')}
              />
            ) : null}

            {style.id === 'array' ? (
              <SelectItem
                label="Array Focal"
                value={arrayFocal}
                onChange={setArrayFocal}
                options={ARRAY_OPTIONS}
                getLabel={(opt) => opt.label}
                getBeadId={(opt) => (opt ? opt.id : '')}
              />
            ) : null}

            <SelectItem
              label="Foundation"
              value={primary}
              onChange={setPrimary}
              options={GEM_OPTIONS}
              getLabel={labelOfGemstoneType}
              getBeadId={(opt) => (opt ? `${opt}-10` : '')}
            />

            {style.id !== 'array' ? (
              <SelectItem
                label="Alternating"
                value={secondary}
                onChange={setSecondary}
                options={GEM_OPTIONS}
                getLabel={(opt) => (opt ? labelOfGemstoneType(opt) : undefined)}
                nullable
                emptyLabel="None"
                emptyOptionLabel="None"
                getBeadId={(opt) => (opt ? `${opt}-10` : '')}
              />
            ) : null}

            <div className="option-item">
              <label className="check-item">
                <input
                  type="checkbox"
                  checked={spacers}
                  onChange={(e) => setSpacers(e.target.checked)}
                />
                Include Spacers
              </label>
            </div>
          </div>
          <div className="option-item">
            <label>Wrist Size</label>
            <div className="options">
              {TARGET_SIZES.map((opt) => (
                <button
                  key={opt.sizeMM}
                  onClick={() => setTargetCircumferenceMM(opt)}
                  className={`btn small${targetCircumferenceMM === opt ? ' primary' : ''}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="details">
              Bracelets are made to your size, with small upward adjustments as needed. This design
              will be about <strong>{circumference.in}&Prime;</strong>.
            </div>
          </div>
        </div>
      </div>
      <footer>
        <button className="btn primary full">Buy Now - ${totalPriceUSD(bracelet)}</button>
      </footer>
    </div>
  )
}
