import { useState } from 'react'
import { baseKeys, findBase, formatValue, MAX_SAFE_INTEGER } from './bases'
import { clampToMaxDigits, validateNumber } from './validation'

export function useConverter() {
  const [input, setInput] = useState('42')
  const [inputBaseKey, setInputBaseKey] = useState('decimal')
  const [visibleBaseKeys, setVisibleBaseKeys] = useState(baseKeys)

  const inputBase = findBase(inputBaseKey)
  const { value, error } = validateNumber(input, inputBase)

  const toggleBase = (key: string) => {
    setVisibleBaseKeys((current) => current.includes(key)
      ? current.filter((currentKey) => currentKey !== key)
      : [...current, key])
  }

  const changeInput = (raw: string) => {
    setInput(clampToMaxDigits(raw, inputBase))
  }

  const changeInputBase = (key: string) => {
    const nextBase = findBase(key)

    if (value !== null && value <= MAX_SAFE_INTEGER) {
      setInput(formatValue(value, nextBase.radix))
    }
    setInputBaseKey(nextBase.key)
  }

  return {
    input,
    inputBase,
    visibleBaseKeys,
    value,
    error,
    changeInput,
    changeInputBase,
    toggleBase,
  }
}
