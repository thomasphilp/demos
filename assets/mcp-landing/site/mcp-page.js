/* biome-ignore-all lint: plain DOM script written as one file; Biome formats it but its lint rules aren't applied */
let started = false

/** The page's motion: the intro, typing, reveals, sliders, cursor grids and shaders. Runs once per page load. */
export function initMcpPage(COPY, LANG) {
  if (started) return
  started = true
  // A refresh always starts at the top, where the intro plays: no restored scroll position
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
  scrollTo(0, 0)
  // The site's nav bar, for the hero's cube placement (a top bar on desktop, a bottom bar on tablets and phones)
  const siteNavBar = () => document.querySelector('.navbar-wrapper-light, .navbar-wrapper')
  /* ── Copy: every visible string in the page body comes from mcp-copy.json, the same file as the marketplace page's
     i18n catalog (src/i18n/catalogs/mcp.json). ?lang=zh-CN shows the Simplified Chinese.
     tools/port-mcp.py builds the marketplace /mcp page from this file; the demo-only blocks below stay here
     (there the page renders the copy itself and the site's own nav, footer and locale are already in place) ── */
  const tr = (key, vars = {}) => (COPY[LANG][key] ?? COPY.en[key] ?? '').replace(/{{(\w+)}}/g, (_, v) => vars[v] ?? '')
  // Typing tokens: words and the spaces between them; Chinese has no spaces, so the segmenter's words, with punctuation
  // kept on the word before it (opening brackets and quotes on the word after)
  const segmenter = LANG === 'zh-CN' && Intl.Segmenter ? new Intl.Segmenter('zh-CN', { granularity: 'word' }) : null
  function words(text) {
    if (!segmenter) return text.split(/(\s+)/).filter(Boolean)
    const out = []
    let open = ''
    for (const { segment, isWordLike } of segmenter.segment(text)) {
      if (/^\s+$/.test(segment)) {
        out.push(segment)
        continue
      }
      if (!isWordLike && /^[（“‘《【(]+$/.test(segment)) {
        open += segment
        continue
      }
      const last = out.length - 1
      if (!isWordLike && last >= 0 && !/^\s+$/.test(out[last])) out[last] += segment
      else {
        out.push(open + segment)
        open = ''
      }
    }
    if (open) out.push(open)
    return out
  }
  // A typed message as [word, bold, space before it]; <b> marks the bold run
  function typedWords(msg) {
    const out = []
    let space = '',
      bold = false
    msg.split(/(<\/?b>)/).forEach((part) => {
      if (part === '<b>' || part === '</b>') {
        bold = part === '<b>'
        return
      }
      words(part).forEach((w) => {
        if (/^\s+$/.test(w)) space = ' '
        else {
          out.push([w, bold, space])
          space = ''
        }
      })
    })
    return out
  }
  /* Icons sourced from icons.json (colors swapped to currentColor) */
  const ICONS = {
    'solid/AI/magic': {
      viewBox: '0 0 24 24',
      inner:
        '<path d="M9.99993 23.8718C9.99105 22.5738 9.71911 21.2907 9.20006 20.1C8.20267 17.7027 6.29732 15.7974 3.90001 14.8C2.7089 14.2808 1.42526 14.0088 0.126826 14C0.0845646 14.0003 0.0422884 14.0003 0 14C0.0422893 13.9997 0.0845655 13.9997 0.126826 14C1.42282 13.9919 2.70499 13.7288 3.90001 13.225C5.08384 12.7139 6.16091 11.9845 7.07497 11.075C7.98217 10.1642 8.7039 9.08591 9.20009 7.89998C9.71911 6.70939 9.99105 5.42631 9.99996 4.12842C9.99969 4.08563 9.99969 4.04282 9.99998 4C10.0003 4.04282 10.0003 4.08563 9.99996 4.12842C10.0082 5.4239 10.2714 6.70553 10.7752 7.89998C11.2862 9.08386 12.0155 10.161 12.925 11.075C13.8391 11.9845 14.9161 12.7139 16.1 13.225C17.295 13.7288 18.5772 13.992 19.8732 14C19.9155 13.9997 19.9577 13.9997 20 14C19.9577 14.0003 19.9155 14.0003 19.8732 14C18.5748 14.0088 17.2911 14.2808 16.1 14.8C14.9141 15.2961 13.8358 16.0178 12.925 16.925C12.0155 17.839 11.2862 18.9161 10.7752 20.1C10.2714 21.2945 10.0081 22.5762 9.99993 23.8718C10.0002 23.9145 10.0002 23.9572 9.99995 24C9.99967 23.9572 9.99966 23.9145 9.99993 23.8718Z" fill="currentColor"/>\n<path d="M18 11.9231C17.9946 11.1443 17.8315 10.3744 17.52 9.66001C16.9216 8.22162 15.7784 7.07842 14.34 6.47999C13.6253 6.16849 12.8552 6.00531 12.0761 6.00001C12.0507 6.00017 12.0254 6.00017 12 6C12.0254 5.99984 12.0507 5.99984 12.0761 6.00001C12.8537 5.99517 13.623 5.83725 14.34 5.535C15.0503 5.22833 15.6965 4.79072 16.245 4.24502C16.7893 3.69853 17.2223 3.05155 17.5201 2.33999C17.8315 1.62564 17.9946 0.855787 18 0.0770578C17.9998 0.0513804 17.9998 0.0256939 18 0C18.0002 0.0256945 18.0002 0.0513809 18 0.0770578C18.0049 0.854344 18.1629 1.62332 18.4651 2.33999C18.7717 3.05032 19.2093 3.69658 19.755 4.24502C20.3034 4.79072 20.9497 5.22833 21.66 5.535C22.377 5.83726 23.1463 5.99517 23.9239 6.00001C23.9493 5.99984 23.9746 5.99984 24 6C23.9746 6.00017 23.9493 6.00017 23.9239 6.00001C23.1449 6.0053 22.3747 6.16848 21.66 6.47999C20.9484 6.77767 20.3015 7.21068 19.755 7.75498C19.2093 8.30342 18.7717 8.94969 18.4651 9.66001C18.1628 10.3767 18.0049 11.1457 18 11.9231C18.0001 11.9487 18.0001 11.9743 18 12C17.9998 11.9743 17.9998 11.9487 18 11.9231Z" fill="currentColor"/>',
    },
    'solid/AI chat': {
      viewBox: '0 0 24 24',
      inner:
        '<path d="M10.5 5.27246C11.1787 5.42548 11.8441 5.64042 12.4854 5.91992C12.833 6.06456 13.1713 6.22643 13.5 6.40332V22.5C13.4999 23.3282 12.8282 23.9999 12 24C11.1718 23.9999 10.5001 23.3282 10.5 22.5V5.27246ZM6.75 5C7.57823 5.00013 8.24987 5.67177 8.25 6.5V17.5C8.24987 18.3282 7.57823 18.9999 6.75 19C5.92177 18.9999 5.25013 18.3282 5.25 17.5V6.5C5.25013 5.67177 5.92177 5.00013 6.75 5ZM15.75 7.99609C16.9652 9.10173 17.937 10.469 18.5801 12.0146C18.6401 12.1523 18.6958 12.2919 18.75 12.4316V17.5C18.7499 18.3282 18.0782 18.9999 17.25 19C16.4218 18.9999 15.7501 18.3282 15.75 17.5V7.99609ZM1.5 8C2.32823 8.00013 2.99987 8.67177 3 9.5V13.5C2.99987 14.3282 2.32823 14.9999 1.5 15C0.671766 14.9999 0.000131894 14.3282 0 13.5V9.5C0.000132 8.67177 0.671767 8.00013 1.5 8ZM23.1094 8.12988C23.6339 8.36359 23.9999 8.88879 24 9.5V13.5C23.9999 14.3282 23.3282 14.9999 22.5 15C21.6718 14.9999 21.0001 14.3282 21 13.5V10.8086C21.5122 9.91803 22.136 9.09427 22.8633 8.36328C22.9434 8.28344 23.027 8.2072 23.1094 8.12988ZM19 0.0644531C19.0041 0.712111 19.1358 1.35304 19.3877 1.9502C19.6432 2.54205 20.0082 3.08013 20.4629 3.53711C20.9199 3.99181 21.458 4.35675 22.0498 4.6123C22.6473 4.86417 23.2885 4.99595 23.9365 5C23.2873 5.00442 22.6453 5.14081 22.0498 5.40039C21.457 5.64845 20.9182 6.00938 20.4629 6.46289C20.0082 6.91987 19.6432 7.45795 19.3877 8.0498C19.1358 8.64695 19.0041 9.28789 19 9.93555C18.9955 9.28669 18.8591 8.64503 18.5996 8.0498C18.1009 6.8514 17.1486 5.89906 15.9502 5.40039C15.3547 5.14081 14.7127 5.00442 14.0635 5C14.7115 4.99595 15.3527 4.86417 15.9502 4.6123C16.542 4.35675 17.0801 3.9918 17.5371 3.53711C17.9906 3.08179 18.3515 2.54302 18.5996 1.9502C18.8591 1.35497 18.9955 0.713313 19 0.0644531ZM12 0C12.8282 0.000131894 13.4999 0.671766 13.5 1.5V3.61035C13.1703 3.79188 12.832 3.9587 12.4854 4.1084C11.8429 4.37921 11.1776 4.58716 10.5 4.73535V1.5C10.5001 0.671767 11.1718 0.000131984 12 0Z" fill="currentColor"/>',
    },
    'outline/bell-alert': {
      viewBox: '0 0 24 24',
      inner:
        '<g clip-path="url(#clip0_1218_7069)">\n<path d="M8.5718 18.0981C9.6959 18.2314 10.8398 18.3 11.9998 18.3C13.1599 18.3 14.304 18.2314 15.4283 18.0981C17.7017 17.8284 19.894 17.2939 21.9734 16.5263C20.2492 14.6124 19.1998 12.0788 19.1998 9.30001V8.45904C19.2 8.43938 19.2 8.41971 19.2 8.40001C19.2 4.42356 15.9765 1.20001 12 1.20001C8.02359 1.20001 4.80004 4.42356 4.80004 8.40001L4.7998 9.30001C4.7998 12.0788 3.75037 14.6124 2.02621 16.5263C4.10572 17.2939 6.29816 17.8285 8.5718 18.0981ZM15.4283 18.0981C15.5398 18.4454 15.6 18.8157 15.6 19.2C15.6 21.1882 13.9883 22.8 12 22.8C10.0118 22.8 8.40004 21.1882 8.40004 19.2C8.40004 18.8157 8.46027 18.4454 8.5718 18.0981M1.34937 6.60001C1.6941 4.54518 2.61908 2.6871 3.95006 1.20001M20.05 1.20001C21.381 2.6871 22.306 4.54518 22.6507 6.60001" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>\n</g>\n<defs>\n<clipPath id="clip0_1218_7069">\n<rect width="24" height="24" fill="white"/>\n</clipPath>\n</defs>',
    },
    'outline/document-check': {
      viewBox: '0 0 24 24',
      inner:
        '<path d="M9.77284 1.36365H4.86375C4.18594 1.36365 3.63647 1.91312 3.63647 2.59092V21.4091C3.63647 22.0869 4.18594 22.6364 4.86375 22.6364H18.7728C19.4506 22.6364 20.0001 22.0869 20.0001 21.4091V11.5909M9.77284 1.36365H10.1819C15.6044 1.36365 20.0001 5.7594 20.0001 11.1818V11.5909M9.77284 1.36365C11.8063 1.36365 13.4547 3.01205 13.4547 5.04547V6.68183C13.4547 7.35963 14.0041 7.9091 14.6819 7.9091H16.3183C18.3517 7.9091 20.0001 9.55751 20.0001 11.5909M8.54557 15.2727L11.0001 17.7273L15.091 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    },
    'outline/truck': {
      viewBox: '0 0 32 24',
      inner:
        '<g clip-path="url(#clip0_1218_7061)">\n<path d="M10.2352 20.8235C10.2352 21.993 9.28713 22.9411 8.11759 22.9411C6.94805 22.9411 5.99994 21.993 5.99994 20.8235M10.2352 20.8235C10.2352 19.6539 9.28713 18.7058 8.11759 18.7058C6.94805 18.7058 5.99994 19.6539 5.99994 20.8235M10.2352 20.8235H18.7058M5.99994 20.8235H3.35288C2.47573 20.8235 1.76465 20.1124 1.76465 19.2352V14.4712M26.1176 20.8235C26.1176 21.993 25.1695 22.9411 23.9999 22.9411C22.8304 22.9411 21.8823 21.993 21.8823 20.8235M26.1176 20.8235C26.1176 19.6539 25.1695 18.7058 23.9999 18.7058C22.8304 18.7058 21.8823 19.6539 21.8823 20.8235M26.1176 20.8235L27.7058 20.8234C28.583 20.8234 29.2992 20.1115 29.2453 19.236C28.9487 14.4253 27.3137 9.97672 24.7081 6.25807C24.1967 5.52829 23.3687 5.09322 22.479 5.04439H18.7058M21.8823 20.8235H18.7058M18.7058 5.04439V3.69141C18.7058 2.89025 18.1093 2.21247 17.3124 2.12977C14.9863 1.88837 12.6252 1.76465 10.2352 1.76465C7.84525 1.76465 5.48416 1.88837 3.15803 2.12977C2.36114 2.21247 1.76465 2.89025 1.76465 3.69141V14.4712M18.7058 5.04439V14.4712M18.7058 20.8235V14.4712M18.7058 14.4712H1.76465" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>\n</g>\n<defs>\n<clipPath id="clip0_1218_7061">\n<rect width="31.0588" height="24" fill="white"/>\n</clipPath>\n</defs>',
    },
    'outline/globe-alt': {
      viewBox: '0 0 24 24',
      inner:
        '<g clip-path="url(#clip0_1218_6738)">\n<path d="M12 22.8C17.031 22.8 21.2586 19.3598 22.4588 14.7035M12 22.8C6.96886 22.8 2.74125 19.3598 1.54111 14.7035M12 22.8C14.9823 22.8 17.4 17.9646 17.4 12C17.4 6.03528 14.9823 1.19995 12 1.19995M12 22.8C9.01761 22.8 6.59995 17.9646 6.59995 12C6.59995 6.03528 9.01761 1.19995 12 1.19995M22.4588 14.7035C22.6815 13.8394 22.8 12.9335 22.8 12C22.8 10.0735 22.2956 8.26487 21.4116 6.69889C19.5588 3.41628 16.0382 1.19995 12 1.19995M1.54111 14.7035C1.31841 13.8394 1.19995 12.9335 1.19995 12C1.19995 10.0735 1.70434 8.26487 2.58826 6.69889C4.44114 3.41628 7.96172 1.19995 12 1.19995M21.4116 6.69889C18.8876 8.88042 15.5979 10.2 12 10.2C8.40202 10.2 5.11227 8.88042 2.58826 6.69889M22.4588 14.7035C19.36 16.4216 15.7942 17.4 12 17.4C8.20568 17.4 4.6399 16.4216 1.54111 14.7035" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>\n</g>\n<defs>\n<clipPath id="clip0_1218_6738">\n<rect width="24" height="24" fill="white"/>\n</clipPath>\n</defs>',
    },
    'outline/document-text': {
      viewBox: '0 0 24 24',
      inner:
        '<path d="M19.9999 14.4546V11.5909C19.9999 9.55751 18.3515 7.9091 16.318 7.9091H14.6817C14.0039 7.9091 13.4544 7.35963 13.4544 6.68183V5.04547C13.4544 3.01205 11.806 1.36365 9.77259 1.36365H7.72714M7.72714 15.2727H15.909M7.72714 18.5455H11.818M10.1817 1.36365H4.8635C4.1857 1.36365 3.63623 1.91312 3.63623 2.59092V21.4091C3.63623 22.0869 4.1857 22.6364 4.8635 22.6364H18.7726C19.4504 22.6364 19.9999 22.0869 19.9999 21.4091V11.1818C19.9999 5.7594 15.6041 1.36365 10.1817 1.36365Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    },
    'outline/squares-plus': {
      viewBox: '0 0 24 24',
      inner:
        '<g clip-path="url(#clip0_1218_6617)">\n<path d="M14 18.5H18.5M18.5 18.5H23M18.5 18.5V14M18.5 18.5V23M4 10H7C8.65685 10 10 8.65685 10 7V4C10 2.34315 8.65685 1 7 1H4C2.34315 1 1 2.34315 1 4V7C1 8.65685 2.34315 10 4 10ZM4 23H7C8.65685 23 10 21.6569 10 20V17C10 15.3431 8.65685 14 7 14H4C2.34315 14 1 15.3431 1 17V20C1 21.6569 2.34315 23 4 23ZM17 10H20C21.6569 10 23 8.65685 23 7V4C23 2.34315 21.6569 1 20 1H17C15.3431 1 14 2.34315 14 4V7C14 8.65685 15.3431 10 17 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>\n</g>\n<defs>\n<clipPath id="clip0_1218_6617">\n<rect width="24" height="24" fill="white"/>\n</clipPath>\n</defs>',
    },
    'outline/puzzle-piece': {
      viewBox: '0 0 24 24',
      inner:
        '<g clip-path="url(#clip0_1218_6668)">\n<path d="M15.143 5.81354C15.143 5.40765 15.3556 5.04077 15.6015 4.71784C15.854 4.3863 16.0001 3.99304 16.0001 3.57132C16.0001 2.38786 14.8489 1.42847 13.4287 1.42847C12.0086 1.42847 10.8573 2.38786 10.8573 3.57132C10.8573 3.99304 11.0035 4.3863 11.2559 4.71784C11.5018 5.04077 11.7144 5.40765 11.7144 5.81354C11.7144 6.22643 11.3763 6.55986 10.9636 6.54797C9.35944 6.50177 7.77253 6.38669 6.20573 6.2056C6.41872 8.04876 6.54035 9.91975 6.56598 11.8139C6.57164 12.2322 6.23205 12.5713 5.81378 12.5713C5.40789 12.5713 5.04101 12.3587 4.71808 12.1128C4.38654 11.8604 3.99328 11.7142 3.57157 11.7142C2.3881 11.7142 1.42871 12.8654 1.42871 14.2856C1.42871 15.7058 2.3881 16.857 3.57157 16.857C3.99328 16.857 4.38654 16.7109 4.71808 16.4584C5.04101 16.2125 5.40789 15.9999 5.81378 15.9999C6.16714 15.9999 6.44764 16.2979 6.42174 16.6503C6.27792 18.6069 6.03148 20.535 5.68777 22.4292C7.42251 22.6464 9.18244 22.7826 10.9636 22.8339C11.3764 22.8457 11.7146 22.5123 11.7146 22.0993C11.7146 21.6934 11.5019 21.3265 11.256 21.0036C11.0036 20.6721 10.8574 20.2788 10.8574 19.8571C10.8574 18.6736 12.0087 17.7142 13.4288 17.7142C14.849 17.7142 16.0003 18.6736 16.0003 19.8571C16.0003 20.2788 15.8541 20.6721 15.6016 21.0036C15.3558 21.3265 15.1431 21.6934 15.1431 22.0993C15.1431 22.4797 15.4609 22.7835 15.8407 22.7612C17.9421 22.6377 20.0118 22.3959 22.0431 22.0424C22.3511 20.273 22.5742 18.4744 22.7083 16.6511C22.7342 16.2983 22.4534 15.9999 22.0996 15.9999C21.6937 15.9999 21.3269 16.2126 21.0039 16.4585C20.6724 16.7109 20.2791 16.8571 19.8574 16.8571C18.6739 16.8571 17.7146 15.7058 17.7146 14.2857C17.7146 12.8655 18.6739 11.7142 19.8574 11.7142C20.2791 11.7142 20.6724 11.8604 21.0039 12.1129C21.3269 12.3588 21.6937 12.5714 22.0996 12.5714C22.5183 12.5714 22.8582 12.2319 22.8526 11.8133C22.8245 9.74176 22.6816 7.69786 22.43 5.68787C20.2747 6.07893 18.0756 6.34407 15.8405 6.47538C15.4607 6.49769 15.143 6.19394 15.143 5.81354Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>\n</g>\n<defs>\n<clipPath id="clip0_1218_6668">\n<rect width="24" height="24" fill="white"/>\n</clipPath>\n</defs>',
    },
    'solid/play': {
      viewBox: '0 0 22 24',
      inner:
        '<g clip-path="url(#clip0_1218_6681)">\n<path fill-rule="evenodd" clip-rule="evenodd" d="M0.666626 3.53692C0.666626 1.63541 2.70529 0.430005 4.37142 1.34638L19.7589 9.80947C21.4858 10.7593 21.4858 13.2407 19.7589 14.1905L4.37142 22.6536C2.70529 23.57 0.666626 22.3646 0.666626 20.4631V3.53692Z" fill="currentColor"/>\n</g>\n<defs>\n<clipPath id="clip0_1218_6681">\n<rect width="21.3333" height="24" fill="white"/>\n</clipPath>\n</defs>',
    },
    'solid/pause': {
      viewBox: '0 0 18 24',
      inner:
        '<path fill-rule="evenodd" clip-rule="evenodd" d="M1.125 1.875C1.125 1.25368 1.62868 0.75 2.25 0.75H4.5C5.12132 0.75 5.625 1.25368 5.625 1.875V22.125C5.625 22.7463 5.12132 23.25 4.5 23.25H2.25C1.95163 23.25 1.66548 23.1315 1.4545 22.9205C1.24353 22.7095 1.125 22.4234 1.125 22.125L1.125 1.875ZM12.375 1.875C12.375 1.25368 12.8787 0.75 13.5 0.75H15.75C16.0484 0.75 16.3345 0.868526 16.5455 1.0795C16.7565 1.29048 16.875 1.57663 16.875 1.875L16.875 22.125C16.875 22.7463 16.3713 23.25 15.75 23.25H13.5C12.8787 23.25 12.375 22.7463 12.375 22.125V1.875Z" fill="currentColor"/>',
    },
    'outline/check': {
      viewBox: '0 0 27 24',
      inner:
        '<path d="M2.25 13.125L11.25 22.125L24.75 1.875" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    },
    'solid/export': {
      viewBox: '0 0 24 24',
      inner:
        '<path fill-rule="evenodd" clip-rule="evenodd" d="M15.4545 2.81818L19.8962 2.81818L16.6462 6.06811C16.2579 5.93164 15.8381 5.85712 15.4 5.85712H4.6C2.61178 5.85712 1 7.39214 1 9.28569V19.5714C1 21.4649 2.61177 23 4.6 23H15.4C17.3882 23 19 21.4649 19 19.5714V9.28569C19 8.45799 18.692 7.69879 18.1793 7.10636L21.1818 4.10383V8.54545C21.1818 9.04753 21.5888 9.45454 22.0909 9.45454C22.593 9.45454 23 9.04753 23 8.54545L23 1.90909C23 1.66798 22.9042 1.43675 22.7337 1.26627C22.5632 1.09578 22.332 1 22.0909 1H15.4545C14.9525 1 14.5455 1.40701 14.5455 1.90909C14.5455 2.41117 14.9525 2.81818 15.4545 2.81818ZM18.1793 7.10636C17.7775 6.64211 17.2499 6.28026 16.6462 6.06811L11.2663 11.4481C10.9112 11.8031 10.9112 12.3787 11.2663 12.7337C11.6213 13.0888 12.1969 13.0888 12.5519 12.7337L18.1793 7.10636Z" fill="currentColor"/>',
    },
    'solid/checkmark': {
      viewBox: '0 0 24 24',
      inner:
        '<path d="M9.80065 21.1782C9.10726 21.1782 8.58722 20.9327 8.12134 20.3883L2.53088 13.717C2.14085 13.2793 2 12.8844 2 12.4361C2 11.4327 2.7584 10.6962 3.80932 10.6962C4.41603 10.6962 4.8494 10.9097 5.25027 11.3793L9.74648 16.8765L18.6089 3.10687C19.0423 2.4344 19.4865 2.17822 20.2015 2.17822C21.2416 2.17822 22 2.90407 22 3.90744C22 4.28103 21.8808 4.67598 21.5991 5.10294L11.5016 20.3136C11.1116 20.9007 10.5374 21.1782 9.80065 21.1782Z" fill="currentColor"/>',
    },
  }
  document.querySelectorAll('[data-icon]').forEach((el) => {
    const icon = ICONS[el.dataset.icon]
    if (icon)
      el.innerHTML = `<svg viewBox="${icon.viewBox}" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${icon.inner}</svg>`
  })

  /* "Your AI agent" tags: turn the icon into a mask (so the sweep can fill it) and wrap the label.
     The phone app's title bar stays still. */
  document.querySelectorAll('.agent-tag').forEach((tag) => {
    if (!/your ai agent/i.test(tag.textContent) || tag.closest('.phone .app-head')) return
    tag.classList.add('is-shimmer')
    const svg = tag.querySelector('.ic svg')
    if (svg) {
      const url = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg.outerHTML)}")`
      const ic = svg.parentElement
      ic.style.webkitMaskImage = url
      ic.style.maskImage = url
      svg.remove()
    }
    ;[...tag.childNodes]
      .filter((n) => n.nodeType === 3 && n.data.trim())
      .forEach((n) => {
        const label = document.createElement('span')
        label.className = 'tag-label'
        label.textContent = n.data.trim()
        n.replaceWith(label)
      })
  })

  /* Hero timestamp: the date and time at page load, e.g. "Friday, Oct 23, 2026 · 2:49 PM" */
  ;(() => {
    const now = new Date()
    const locale = LANG === 'zh-CN' ? 'zh-CN' : 'en-US'
    const date = now.toLocaleDateString(locale, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
    const time = now.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })
    document.getElementById('hero-time').textContent = `${date} · ${time}`
  })()

  /* VS Code mark (masked layers, as authored in Figma) */
  document.querySelectorAll('[data-vscode]').forEach((el) => {
    const p = el.dataset.vscode === 'apps' ? 'assets/mcp-landing/site/images/mcp/apps-vscode-' : 'assets/mcp-landing/site/images/mcp/vscode-'
    const mask =
      el.dataset.vscode === 'apps' ? 'assets/mcp-landing/site/images/mcp/apps-vscode-mask.svg' : 'assets/mcp-landing/site/images/mcp/vscode-mask.svg'
    const layers = [
      ['v1', '0% 0%'],
      ['v2', '0% 100%'],
      ['v3', '100% 0%'],
      ['v4', '0% 0%'],
    ]
    el.innerHTML = layers.map(([c], i) => `<div class="${c}"><img src="${p}${i + 1}.svg" alt=""></div>`).join('')
    // Mask is the full 24x23.876 glyph; offset per layer so it lines up with the whole mark
    const s = el.getBoundingClientRect().width || 24
    const k = s / 24
    const pos = { v1: [0.015, 0], v2: [0.015, -5.737], v3: [-16.5, 0], v4: [0.015, 0] }
    el.querySelectorAll(':scope > div').forEach((d) => {
      const [x, y] = pos[d.className]
      const v = `url(${mask})`
      d.style.webkitMaskImage = v
      d.style.maskImage = v
      const size = `${24 * k}px ${23.876 * k}px`
      d.style.webkitMaskSize = size
      d.style.maskSize = size
      const position = `${x * k}px ${y * k}px`
      d.style.webkitMaskPosition = position
      d.style.maskPosition = position
    })
  })

  /* Logo marquee: two identical sets, track slides -929px over 20s */
  const LOGOS = [
    ['logo-claude.svg', 'Claude'],
    ['logo-chatgpt.svg', 'ChatGPT'],
    ['logo-grok.svg', 'Grok'],
    ['logo-grokbot.svg', 'Grok bot'],
    ['vscode', 'VS Code'],
    ['logo-windsurf.svg', 'Windsurf'],
  ]
  const track = document.getElementById('marquee-track')
  const logoHtml = LOGOS.map(([src, name]) =>
    src === 'vscode'
      ? `<span class="app-logo"><span class="vscode" data-vscode-hero></span>${name}</span>`
      : `<span class="app-logo"><img src="assets/mcp-landing/site/images/mcp/${src}" alt="">${name}</span>`,
  ).join('')
  track.innerHTML = logoHtml + logoHtml
  track.querySelectorAll('[data-vscode-hero]').forEach((el) => {
    el.dataset.vscode = 'hero'
    const pos = { v1: [0.015, 0], v2: [0.015, -5.737], v3: [-16.5, 0], v4: [0.015, 0] }
    el.innerHTML = ['v1', 'v2', 'v3', 'v4']
      .map((c, i) => `<div class="${c}"><img src="assets/mcp-landing/site/images/mcp/vscode-${i + 1}.svg" alt=""></div>`)
      .join('')
    el.querySelectorAll(':scope > div').forEach((d) => {
      const [x, y] = pos[d.className]
      const v = 'url(assets/mcp-landing/site/images/mcp/vscode-mask.svg)'
      d.style.webkitMaskImage = v
      d.style.maskImage = v
      d.style.webkitMaskSize = d.style.maskSize = '24px 23.876px'
      d.style.webkitMaskPosition = d.style.maskPosition = `${x}px ${y}px`
    })
  })

  /* Copy buttons */
  const checkIcon = `<svg viewBox="${ICONS['outline/check'].viewBox}" fill="none" aria-hidden="true">${ICONS['outline/check'].inner}</svg>`
  // The async clipboard first; where it's refused (a frame without clipboard-write, an insecure origin) a hidden
  // textarea and execCommand('copy') still get the URL on the clipboard
  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {}
    const ta = Object.assign(document.createElement('textarea'), { value: text, readOnly: true })
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none'
    document.body.appendChild(ta)
    ta.select()
    let ok = false
    try {
      ok = document.execCommand('copy')
    } catch {}
    ta.remove()
    return ok
  }
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    // "Copy" sizes the button; "Copied" overlays it and the button widens to fit while it shows
    const label = btn.textContent.trim()
    btn.innerHTML = `<span class="copy-stack" aria-hidden="true"><span class="lbl lbl-copy">${label}</span><span class="lbl lbl-done">${checkIcon}${tr('copied')}</span></span>`
    const done = btn.querySelector('.lbl-done'),
      name = tr('copyAria')
    btn.setAttribute('aria-label', name)
    let timer
    btn.addEventListener('click', async () => {
      btn.classList.remove('is-tapped')
      void btn.offsetWidth
      btn.classList.add('is-tapped')
      if (await copyText(btn.dataset.copy)) {
        done.innerHTML = `${checkIcon}${tr('copied')}`
        btn.setAttribute('aria-label', tr('copied'))
      } else {
        done.textContent = tr('copyFailed')
        btn.setAttribute('aria-label', tr('copyFailed'))
      }
      const cs = getComputedStyle(btn)
      btn.style.setProperty(
        '--done-w',
        `${done.offsetWidth + parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight)}px`,
      )
      btn.classList.add('is-copied')
      clearTimeout(timer)
      timer = setTimeout(() => {
        btn.classList.remove('is-copied')
        btn.setAttribute('aria-label', name)
      }, 1600)
    })
    btn.addEventListener('animationend', (e) => {
      if (e.animationName === 'mcp-copy-tap') btn.classList.remove('is-tapped')
    })
  })

  /* ── Hero intro: composer types the question, then hands off to the chat ── */
  const hero = document.querySelector('.hero')
  const typedEl = hero.querySelector('.typed-text')
  const composer = hero.querySelector('.intro-composer')
  const QUESTION = typedWords(tr('heroQuestion')) // the <b> run types bold: the ask itself (as "ship freight" was in Figma 299:692)
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  let introTimers = []
  const later = (fn, ms) => introTimers.push(setTimeout(fn, ms))
  function playIntro() {
    introTimers.forEach(clearTimeout)
    introTimers = []
    typedEl.textContent = ''
    hero.dataset.intro = 'start'
    composer.classList.remove('is-leaving')
    composer.classList.add('is-empty')
    twReset(heroTitle)
    hero.classList.remove('is-answered')
    if (reducedMotion) {
      hero.dataset.intro = 'done'
      twType(heroTitle, { onDone: heroAnswered })
      return
    }
    later(() => {
      hero.dataset.intro = 'composer'
    }, 120)
    // Reveal word by word: each word fades up into place, caret follows
    const words = QUESTION
    const START = 1050,
      RATE = (85 + 1000 / words.length) / 1.5 // words start once the entrance bounce has settled; the question takes ~1.2s to type (50% faster than the first ~1.8s)
    later(() => composer.classList.add('is-typing'), START)
    words.forEach(([word, isBold, space], i) =>
      later(
        () => {
          const span = document.createElement('span')
          span.className = isBold ? 'word is-bold' : 'word'
          span.textContent = word
          if (space) typedEl.appendChild(document.createTextNode(space)) // a plain space between words, so a wrapped line doesn't start with one
          typedEl.appendChild(span)
          composer.classList.remove('is-empty')
        },
        START + i * RATE,
      ),
    )
    const typed = START + words.length * RATE
    later(() => composer.classList.remove('is-typing'), typed)
    // A beat after the last word: press send, then the input bounces out as the chat grows in
    const PRESS = typed + 450
    later(() => sendBtn.classList.add('is-pressed'), PRESS)
    // The input starts leaving first; the chat grows in a beat later, once the input is on its way out
    const LEAVE = PRESS + 320,
      LEAD = 380 // the input is mostly faded by the time the chat starts growing in
    later(() => composer.classList.add('is-leaving'), LEAVE)
    later(() => {
      hero.dataset.intro = 'done'
    }, LEAVE + LEAD)
    // The agent's answer types in once the chat has grown in and the bubble has landed
    later(() => twType(heroTitle, { onDone: heroAnswered }), LEAVE + LEAD + 1100)
  }
  // Once the hero answer is typed: bring in the connect block, then let the rest of the page start revealing
  // (at once when the visitor skipped the intro by scrolling)
  let introSkipped = false
  function heroAnswered() {
    hero.classList.add('is-answered')
    document.dispatchEvent(new CustomEvent('hero:answered', { detail: { skipped: introSkipped } }))
  }
  // Scrolling down during the intro jumps it to its end: the input gone, the chat in, the answer fully typed
  function skipIntro() {
    if (hero.classList.contains('is-answered')) return
    introSkipped = true
    introTimers.forEach(clearTimeout)
    introTimers = []
    composer.classList.remove('is-typing')
    composer.classList.add('is-leaving')
    hero.dataset.intro = 'done'
    if (!heroTitle._tw?.finish || heroTitle.classList.contains('is-typed')) twType(heroTitle, { onDone: heroAnswered })
    heroTitle._tw.finish()
  }
  // Only scrolling down counts, so Replay intro's smooth scroll back up doesn't skip the replay
  let introY = scrollY
  addEventListener(
    'scroll',
    () => {
      if (scrollY > 40 && scrollY > introY) skipIntro()
      introY = scrollY
    },
    { passive: true },
  )
  const heroTitle = document.getElementById('hero-title')
  const sendBtn = composer.querySelector('.send')
  sendBtn.addEventListener('animationend', () => sendBtn.classList.remove('is-pressed'))
  // Start once the hero photo is ready (fallback after 1.5s) so the first frames aren't stalled by decoding
  const heroVideo = hero.querySelector('.hero-bg video')
  /* Cube dead centre in the viewport: size the clip to the width (at least a 60%-of-screen cube, up to 300px),
     then place it so the cube's centre lands on the viewport's centre. The input and the chat's grow-in
     origin follow the cube. */
  ;(() => {
    const VW = 1536,
      VH = 672 // clip size
    const CX = 0.535,
      CY = 0.33 // cube centre in the clip, averaged over 0–8s
    const CUBE_W = 0.2 // cube width as a share of the clip width
    const CUBE_TOP = 0.12 // cube's top edge as a share of the clip height
    const bg = hero.querySelector('.hero-bg'),
      fade = hero.querySelector('.hero-fade'),
      chat = hero.querySelector('.chat-app')
    const place = () => {
      const w = bg.clientWidth
      const heroTop = hero.getBoundingClientRect().top + scrollY
      const cubeY = innerHeight / 2 - heroTop // hero coords
      const y = cubeY - bg.offsetTop // .hero-bg coords
      // Desktop (past the 1000px breakpoint) shows the cube 50% bigger
      const s =
        Math.max(w / VW, w / 2 / ((1 - CX) * VW), w / 2 / (CX * VW), Math.min(innerWidth * 0.6, 300) / (CUBE_W * VW)) *
        (innerWidth > 1000 ? 1.5 : 1)
      const vw = VW * s,
        vh = VH * s,
        top = y - CY * vh
      Object.assign(heroVideo.style, {
        left: `${w / 2 - CX * vw}px`,
        top: `${top}px`,
        width: `${vw}px`,
        height: `${vh}px`,
      })
      heroVideo.classList.add('is-placed')
      bg.style.height = `${top + vh}px`
      bg.style.setProperty('--sky-h', `${Math.max(0, top)}px`)
      // White fade: fully white at the chat card's middle (over 90% of its top half), solid white down to the clip's end
      const mid = chat.offsetTop + chat.offsetHeight / 2,
        fadeLen = Math.max(200, (mid - chat.offsetTop) * 0.9)
      fade.style.top = `${mid - fadeLen}px`
      fade.style.height = `${Math.max(fadeLen, bg.offsetTop + top + vh - (mid - fadeLen))}px`
      const drop = fadeLen * 0.35,
        introLen = fadeLen * 0.75
      fade.style.setProperty('--fade-len-done', `${fadeLen}px`)
      fade.style.setProperty('--fade-len-intro', `${introLen}px`)
      fade.style.setProperty('--fade-drop', `${drop}px`)
      hero.style.setProperty('--fade-a', `${mid - fadeLen}px`)
      hero.style.setProperty('--fade-b', `${mid}px`)
      hero.style.setProperty('--fade-a-intro', `${mid - fadeLen + drop}px`)
      hero.style.setProperty('--fade-b-intro', `${mid - fadeLen + drop + introLen}px`)
      hero.style.setProperty('--cube-y', `${cubeY}px`)
      chat.style.transformOrigin = `50% ${cubeY - chat.offsetTop}px`
      // Once the chat is in, lift the clip (with its sky and fade) so the cube's top peeks above the card:
      // a share of the gap between the nav and the card, never sliding it down, plus 10px more
      // The site nav is a 64px bar at the top (a bottom bar on phones, which the card never meets)
      const bar = siteNavBar(),
        b = bar?.getBoundingClientRect()
      const navBottom = b && b.top < innerHeight / 2 ? b.bottom + scrollY - heroTop : 0 // hero coords
      const peek = Math.min(110, Math.max(24, (chat.offsetTop - navBottom) * 0.6))
      const cubeTop = cubeY - (CY - CUBE_TOP) * vh
      hero.style.setProperty('--cube-lift', `${Math.min(0, chat.offsetTop - peek - cubeTop) - 10}px`)
    }
    addEventListener('resize', place)
    new ResizeObserver(place).observe(chat)
    place()
  })()
  // Started from script (muted) rather than the autoplay attribute; skipped for reduced motion
  if (!reducedMotion) {
    heroVideo.muted = true
    heroVideo.play().catch(() => {})
  }
  const heroReady = new Promise((r) =>
    heroVideo.readyState >= 2 ? r() : heroVideo.addEventListener('loadeddata', r, { once: true }),
  )
  Promise.race([heroReady, new Promise((r) => setTimeout(r, 1500))]).then(() =>
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (!introSkipped) playIntro()
      }),
    ),
  )

  /* ── Chat examples: Rest → Hover, reply types in led by the cursor ── */
  // Copy from mcp-copy.json (ex1Q, ex1Lead …); w is the resting bubble's width, tuned to the English (Chinese sizes to its text);
  // the hover bubble takes its own copy where the English breaks a long question in two
  const EX_LAYOUT = [
    { w: 420 },
    { w: 362, hover: true },
    { w: 350 },
    { w: 441, hover: true },
    { w: null },
    { w: 296, file: 'Contacts.csv' },
  ]
  const EXAMPLES = EX_LAYOUT.map(({ w, hover, file }, i) => {
    const n = i + 1,
      q = tr(`ex${n}Q`)
    return {
      q,
      w: LANG === 'en' ? w : null,
      hq: hover ? tr(`ex${n}QHover`) : q,
      file,
      lead: tr(`ex${n}Lead`),
      box: COPY.en[`ex${n}Box`] ? tr(`ex${n}Box`) : '',
      ask: tr(`ex${n}Ask`),
    }
  })
  const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])
  const grid = document.getElementById('examples-grid')
  grid.innerHTML = EXAMPLES.map(
    (ex, i) => `
    <article class="ex-card${ex.file ? ' has-file' : ''}" tabindex="0" data-i="${i}" aria-label="${esc(tr('exampleAria', { question: ex.q }))}">
      <div class="ex-head">
        <span class="agent-stack">
          <span class="sphere"><img src="assets/mcp-landing/site/images/mcp/agent-sphere.svg" alt=""></span>
          <img class="mark" src="assets/mcp-landing/site/images/mcp/agent-openai.svg" alt="">
          <img class="mark" src="assets/mcp-landing/site/images/mcp/agent-claude.svg" alt="">
        </span>
        <span class="agent-tag">${tr('anyAgent')}</span>
      </div>
      <div class="ex-rest">
        ${
          ex.file
            ? `<div class="rest-q"${ex.w ? ` style="width:${ex.w}px"` : ''}><p class="bubble">${esc(ex.q)}</p><div class="attachment"><span class="chip">${ex.file}</span></div></div>`
            : `<p class="bubble" style="${ex.w ? `width:${ex.w}px` : LANG === 'en' ? 'white-space:nowrap' : ''}">${esc(ex.q)}</p>`
        }
        <span class="caret-down"><img src="assets/mcp-landing/site/images/mcp/caret-down.svg" alt=""></span>
      </div>
      <div class="ex-hover" aria-live="polite">
        <div class="panel"></div>
        <div class="q"><p class="bubble">${esc(ex.hq)}</p>${ex.file ? `<div class="attachment"><span class="chip">${ex.file}</span></div>` : ''}<span class="sent">${tr('sentBy')}</span></div>
        <div class="reply">
          <span class="sparks"><span class="spark ic" data-icon="solid/AI/magic"></span><span class="spark ic is-next" data-icon="solid/AI/magic" aria-hidden="true"></span></span>
          <div class="body"><span class="agent-tag is-shimmer think" aria-hidden="true"><span class="tag-label"></span></span><p class="lead"></p><p class="box"${ex.box ? '' : ' hidden'}></p><p class="ask"></p></div>
          <span class="dot is-resting"></span>
        </div>
      </div>
    </article>`,
  ).join('')
  grid.querySelectorAll('.spark[data-icon]').forEach((el) => {
    const icon = ICONS[el.dataset.icon]
    if (icon)
      el.innerHTML = `<svg viewBox="${icon.viewBox}" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${icon.inner}</svg>`
  })

  const WORD_MS = 60 // 50% faster than the original 90ms per word
  // What the agent says while it thinks: one is picked at random each time a card opens (never the same twice running)
  const THINKING = Array.from({ length: 12 }, (_, i) => tr(`thinking${i + 1}`))
  function typeReply(card) {
    const ex = EXAMPLES[card.dataset.i]
    const hover = card.querySelector('.ex-hover')
    const [lead, box, ask] = hover.querySelectorAll('.body > p')
    const dot = hover.querySelector('.reply > .dot')
    const reply = hover.querySelector('.reply'),
      think = reply.querySelector('.think .tag-label')
    const parts = [[lead, ex.lead], ...(ex.box ? [[box, ex.box]] : []), [ask, ex.ask]]
    cancelTyping(card)
    // The gray box hugs its finished text: size it once up front (plus room for the caret) so it doesn't grow as it types
    box.style.width = ''
    box.textContent = ex.box
    box.style.width = `${Math.min(box.parentElement.clientWidth, box.offsetWidth + 12)}px`
    parts.forEach(([el]) => {
      el.textContent = ''
    })
    box.style.opacity = '0'
    const cursor = document.createElement('span')
    cursor.className = 'dot is-inline'
    dot.style.visibility = 'hidden'
    const timers = (card._timers = [])
    reply.classList.remove('is-thinking')
    if (reducedMotion) {
      parts.forEach(([el, text]) => {
        el.textContent = text
      })
      box.style.opacity = '1'
      dot.style.visibility = ''
      return
    }
    // Think first: the star works and a random line sweeps, for a random beat, then the reply starts typing
    let pick
    do {
      pick = THINKING[Math.floor(Math.random() * THINKING.length)]
    } while (THINKING.length > 1 && pick === card._lastThink)
    card._lastThink = pick
    think.textContent = pick
    const thinkMs = 1100 + Math.random() * 400 // half what it was; still long enough for one full star handoff
    timers.push(setTimeout(() => reply.classList.add('is-thinking'), 200))
    timers.push(setTimeout(() => reply.classList.remove('is-thinking'), 200 + thinkMs))
    const t = typeParts(parts, box, cursor, 200 + thinkMs + 160, timers)
    timers.push(
      setTimeout(() => {
        cursor.remove()
        dot.style.visibility = ''
      }, t + 100),
    )
  }
  // Types each [el, text] in turn from time t, word by word, with the inline square caret right after the newest word.
  // The gray box shows as its turn starts. Returns the time the last word lands.
  function typeParts(parts, box, cursor, t, timers) {
    parts.forEach(([el, text]) => {
      timers.push(
        setTimeout(() => {
          if (el === box) box.style.opacity = '1'
          el.textContent = ''
          el.appendChild(cursor)
        }, t),
      )
      t += el === box ? 80 : 27
      const node = document.createTextNode('')
      timers.push(setTimeout(() => el.insertBefore(node, cursor), t - 1))
      const tokens = words(text)
      let shown = '',
        n = 0
      tokens.forEach((tok) => {
        shown += tok
        if (/^\s+$/.test(tok)) return
        const upTo = shown
        timers.push(
          setTimeout(
            () => {
              node.data = upTo
            },
            t + ++n * WORD_MS,
          ),
        )
      })
      t += n * WORD_MS + 80
    })
    return t
  }
  function cancelTyping(card) {
    ;(card._timers || []).forEach(clearTimeout)
    card._timers = []
    card.querySelector('.ex-hover .reply')?.classList.remove('is-thinking')
  }
  function fillReply(card) {
    const ex = EXAMPLES[card.dataset.i]
    const [lead, box, ask] = card.querySelectorAll('.ex-hover .body > p')
    lead.textContent = ex.lead
    box.textContent = ex.box
    ask.textContent = ex.ask
    box.style.opacity = '1'
    card.querySelector('.reply > .dot').style.visibility = ''
  }
  const openCard = (card) => {
    if (card.classList.contains('is-open')) return
    card.classList.add('is-open')
    typeReply(card)
  }
  const closeCard = (card) => {
    if (document.body.classList.contains('show-all')) return
    card.classList.remove('is-open')
    cancelTyping(card)
  }
  grid.querySelectorAll('.ex-card').forEach((card) => {
    card.addEventListener('mouseenter', () => openCard(card))
    card.addEventListener('mouseleave', () => closeCard(card))
    card.addEventListener('focus', () => openCard(card))
    card.addEventListener('blur', () => closeCard(card))
    card.addEventListener(
      'touchstart',
      () => {
        grid.querySelectorAll('.ex-card.is-open').forEach((c) => {
          if (c !== card) closeCard(c)
        })
        card.classList.contains('is-open') ? closeCard(card) : openCard(card)
      },
      { passive: true },
    )
  })

  /* ── Typewriter for AI replies: words appear one at a time, a square caret leads each word ── */
  function twPrep(el) {
    if (el._tw) return el._tw
    el.setAttribute('aria-label', el.textContent.trim())
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    const nodes = []
    while (walker.nextNode()) nodes.push(walker.currentNode)
    nodes.forEach((node) => {
      const frag = document.createDocumentFragment()
      words(node.data).forEach((tok) => {
        if (!tok) return
        if (/^\s+$/.test(tok)) {
          frag.appendChild(document.createTextNode(tok))
          return
        }
        const w = document.createElement('span')
        w.className = 'tw-w'
        w.textContent = tok
        frag.appendChild(w)
      })
      node.replaceWith(frag)
    })
    const caret = document.createElement('span')
    caret.className = 'tw-caret'
    caret.setAttribute('aria-hidden', 'true')
    el.appendChild(caret)
    el.classList.add('tw')
    return (el._tw = { words: [...el.querySelectorAll('.tw-w')], caret, timers: [] })
  }
  function twReset(el) {
    const tw = twPrep(el)
    tw.timers.forEach(clearTimeout)
    tw.timers = []
    tw.finish = null
    tw.words.forEach((w) => w.classList.remove('is-on'))
    tw.caret.classList.remove('is-on', 'is-resting')
    el.classList.remove('is-typed')
  }
  // The resting square under a reply (if any) sets the caret's size and colour, so it never changes size
  function twRest(el) {
    const next = el.nextElementSibling
    return next && next.classList.contains('cursor-block') ? next : null
  }
  function twPlace(el, word) {
    const tw = el._tw,
      host = el.getBoundingClientRect()
    // Rects are on-screen px; the caret is placed in the element's own px, so undo any scale on the way (the slider artboard)
    const k = el.offsetWidth ? host.width / el.offsetWidth : 1
    const cs = getComputedStyle(el),
      fs = parseFloat(cs.fontSize),
      rest = twRest(el),
      fixed = parseFloat(cs.getPropertyValue('--tw-caret'))
    // No resting square (the Autopilot replies): the caret is the font's x-height (1ex), measured in the reply's own type
    const exProbe =
      !rest && Object.assign(document.createElement('span'), { style: 'position:absolute;width:1ex;height:0' })
    if (exProbe) el.appendChild(exProbe)
    const size =
      fixed || Math.round((rest ? rest.getBoundingClientRect().width : exProbe.getBoundingClientRect().width) / k)
    if (exProbe) exProbe.remove()
    const target = word || tw.words[0]
    const rects = target.getClientRects()
    const r = word ? rects[rects.length - 1] : rects[0]
    // Sit the square on the baseline (bottom of the x-height): measure it with a zero-size probe beside the word
    const probe = document.createElement('span')
    probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline'
    word ? target.after(probe) : target.before(probe)
    const baseline = probe.getBoundingClientRect().bottom
    probe.remove()
    const x = ((word ? r.right : r.left) - host.left) / k + (word ? fs * 0.12 : 0)
    const y = (baseline - host.top) / k - size
    const bg = rest ? `background:${getComputedStyle(rest).backgroundColor};` : ''
    tw.caret.style.cssText = `width:${size}px;height:${size}px;${bg}transform:translate(${x}px,${y}px)`
  }
  // After the last word: the caret goes and the resting square simply appears in its final spot (no travel)
  function twSettle(el, done) {
    if (el.hasAttribute('data-tw-keep')) twKeep(el)
    else el._tw.caret.classList.remove('is-on')
    done()
  }
  // A kept caret blinks after the last word, and follows it when the line rewraps
  function twKeep(el) {
    const tw = el._tw,
      last = tw.words[tw.words.length - 1]
    twPlace(el, last)
    tw.caret.classList.add('is-on', 'is-resting')
    if (!el._twRo)
      (el._twRo = new ResizeObserver(() => tw.caret.classList.contains('is-resting') && twPlace(el, last))).observe(el)
  }
  function twType(el, { start = 0, rate = 120, onDone } = {}) {
    // 120ms a word: 50% faster than the original 180
    const tw = twPrep(el)
    twReset(el)
    // tw.finish() puts every word in at once and settles the caret (the reveal queue calls it when the visitor scrolls past)
    let done = false
    const finish = () => {
      if (done) return
      done = true
      tw.timers.forEach(clearTimeout)
      tw.timers = []
      tw.words.forEach((w) => w.classList.add('is-on'))
      twSettle(el, () => {
        el.classList.add('is-typed')
        onDone && onDone()
      })
    }
    tw.finish = finish
    if (reducedMotion) {
      finish()
      return
    }
    const at = (fn, ms) => tw.timers.push(setTimeout(fn, ms))
    at(() => {
      twPlace(el, null)
      tw.caret.classList.add('is-on')
    }, start)
    tw.words.forEach((w, i) =>
      at(
        () => {
          w.classList.add('is-on')
          twPlace(el, w)
        },
        start + 147 + i * rate,
      ),
    )
    at(finish, start + 147 + tw.words.length * rate + 187)
  }

  /* ── Iridescent words: the RGB split and glow are one-line copies, so they sit out wherever the words wrap ── */
  document.querySelectorAll('.iri').forEach((el) => {
    const fill = el.querySelector('.iri-fill')
    const check = () =>
      el.classList.toggle(
        'is-wrapped',
        new Set([...fill.getClientRects()].filter((r) => r.width > 1).map((r) => Math.round(r.top))).size > 1,
      )
    new ResizeObserver(check).observe(el.closest('h1, h2') || el)
    check()
  })

  /* ── Hero connect frame: trace the comet's two paths from the frame lines (offsets, so the reveal and glitch don't skew them) ── */
  ;(() => {
    const frame = document.querySelector('.hero-connect')
    if (!frame) return
    const NS = 'http://www.w3.org/2000/svg'
    const svg = document.createElementNS(NS, 'svg')
    svg.setAttribute('class', 'cf-comet')
    svg.setAttribute('aria-hidden', 'true')
    // 8 paths per comet (4 tail layers × left/right); the second 8 are a follower that trails the first by FOLLOW ms
    const paths = []
    for (let i = 0; i < 16; i++) {
      const p = document.createElementNS(NS, 'path')
      if (i >= 8) p.classList.add('is-follow')
      svg.appendChild(p)
      paths.push(p)
    }
    frame.appendChild(svg)
    const top = frame.querySelectorAll('.cf-edge.is-top .cf-line'),
      bot = frame.querySelectorAll('.cf-edge.is-bottom .cf-line')
    const box = (el) => {
      let x = 0,
        y = 0,
        n = el
      while (n && n !== frame) {
        x += n.offsetLeft
        y += n.offsetTop
        n = n.offsetParent
      }
      return { x, y, w: el.offsetWidth, h: el.offsetHeight }
    }
    // Each tail layer's length as a share of the path; the head runs 0 → 1.2 of the path in the first 70% of each 2s loop
    // Each loop randomly runs one comet or two, the second close behind the first
    const LENS = [0.03, 0.07, 0.12, 0.18],
      RUN = 1.2,
      LOOP = 2000,
      FOLLOW = 120
    let anims = [],
      playing = false,
      picker = 0
    const run = () => {
      const L = paths[0].getTotalLength() // both sides are the same length
      if (!L) return
      const t = anims[0] ? anims[0].currentTime : null
      anims.forEach((a) => a.cancel())
      anims = paths.map((p, i) => {
        const len = LENS[i % 4] * L
        p.style.strokeDasharray = `${len}px ${L * 3}px`
        return p.animate(
          [
            { strokeDashoffset: `${len}px`, easing: 'cubic-bezier(.45,0,.35,1)' },
            { strokeDashoffset: `${len - RUN * L}px`, offset: 0.7 },
            { strokeDashoffset: `${len - RUN * L}px` },
          ],
          {
            duration: LOOP,
            iterations: Infinity,
            delay: (t === null ? 1200 : 0) + (i >= 8 ? FOLLOW : 0),
            fill: i >= 8 ? 'backwards' : 'auto',
          },
        )
      })
      if (t !== null)
        anims.forEach((a) => {
          a.currentTime = t
        }) // re-traced on resize: keep the beat
      pick()
    }
    // Re-roll one or two comets while both are parked past the line ends (85% into the lead's loop)
    const pick = () => {
      clearTimeout(picker)
      const a = anims[0],
        at = 0.85 * LOOP
      const local = a.currentTime - a.effect.getTiming().delay // ms into the lead's loops, negative before it starts
      const phase = local < 0 ? null : local % LOOP
      if (phase === null || phase >= at - 30) svg.classList.toggle('is-double', Math.random() < 0.5)
      picker = setTimeout(pick, Math.max(50, phase === null ? at - local : (at - phase + LOOP) % LOOP))
    }
    const trace = () => {
      const W = frame.offsetWidth,
        H = frame.offsetHeight
      svg.setAttribute('width', W)
      svg.setAttribute('height', H)
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`)
      const [tl, tr] = [...top].map(box),
        [bl, br] = [...bot].map(box)
      const ty = tl.y + 0.5,
        by = bl.y + bl.h - 0.5
      // Left: bottom line's inner end → corner → up the side → top line's inner end; right is the mirror
      const left = `M${bl.x + bl.w} ${by} H${bl.x + 0.5} V${ty} H${tl.x + tl.w}`
      const right = `M${br.x} ${by} H${br.x + br.w - 0.5} V${ty} H${tr.x}`
      paths.forEach((p, i) => p.setAttribute('d', i < 4 ? left : right))
      if (playing) run()
    }
    new ResizeObserver(trace).observe(frame)
    trace()
    // It starts once the reply has come in and the connect block is showing
    const start = () => {
      if (playing || reducedMotion) return
      playing = true
      run()
    }
    if (document.querySelector('.hero.is-answered')) start()
    else document.addEventListener('hero:answered', start, { once: true })
  })()

  /* ── MCP URL boxes: a comet laps the 1px rim at an even speed, once every 4s ── */
  document.querySelectorAll('.mcp-url').forEach((box) => {
    if (reducedMotion) return
    const NS = 'http://www.w3.org/2000/svg'
    const svg = document.createElementNS(NS, 'svg')
    svg.setAttribute('class', 'rim-comet')
    svg.setAttribute('aria-hidden', 'true')
    const paths = [0, 1, 2, 3].map(() => svg.appendChild(document.createElementNS(NS, 'path')))
    box.prepend(svg) // under the surface, so only the rim shows
    // Each layer's length as a share of the rim; the head runs one lap per loop
    const LENS = [0.06, 0.12, 0.2, 0.3],
      LOOP = 4000
    let anims = []
    const trace = () => {
      const W = box.offsetWidth,
        H = box.offsetHeight
      if (!W) return
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`)
      paths.forEach((p) => p.setAttribute('d', `M0.5 0.5 H${W - 0.5} V${H - 0.5} H0.5 Z`)) // clockwise from the top-left corner
      const P = paths[0].getTotalLength()
      const t = anims[0] ? anims[0].currentTime : 0
      anims.forEach((a) => a.cancel())
      anims = paths.map((p, i) => {
        const len = LENS[i] * P
        p.style.strokeDasharray = `${len}px ${P - len}px`
        return p.animate([{ strokeDashoffset: `${len}px` }, { strokeDashoffset: `${len - P}px` }], {
          duration: LOOP,
          iterations: Infinity,
        })
      })
      anims.forEach((a) => {
        a.currentTime = t
      }) // re-traced on resize: keep its place
    }
    new ResizeObserver(trace).observe(box)
    trace()
  })

  /* ── Hero chat card: fade its chrome to white from the top of the connect block ── */
  ;(() => {
    const card = document.querySelector('.chat-app')
    const connect = card.querySelector('.hero-connect')
    const FADE_SPAN = 0.55 // fully white by ~55% of the way down the connect block
    const place = () => {
      const top = connect.offsetTop - card.clientTop
      card.style.setProperty('--fade-start', `${top}px`)
      card.style.setProperty('--fade-end', `${Math.round(top + connect.offsetHeight * FADE_SPAN)}px`)
    }
    new ResizeObserver(place).observe(card)
    place()
  })()

  /* ── Scroll reveal: everything after the hero fades up once, as it scrolls into view ── */
  ;(() => {
    // Each group staggers its items slightly, like a section's headline then its body; [selector, stagger] sets its own gap,
    // and [selector, stagger, true] staggers all its matches as one run instead of per parent
    const GROUPS = [
      '.exchange-user .page-bubble, .exchange-user .sent-by, .exchange-agent > :not([data-typewriter]):not(.cursor-block)',
      '.bracket, .bracket-copy',
      '.examples-photo',
      '.ex-card',
      '.stage-wrap, .stage-nav',
      '.ap-box',
      '.ap-row',
      '.app-tile',
      '.setup-bg',
      '.steps',
      '.step',
      '.examples > .signup-note, .apps .signup-note',
      ['.cta > .powered, .cta .actions > *', 0.35, true], // after the typed headline: Powered by, then Sign up and the URL box
    ]
    const STAGGER = 0.06
    // Section headlines type quicker than replies (75ms a word), so what's under them isn't held up for long
    const twRate = (el) => (el.matches('.display') ? 75 : undefined)
    const hero = document.querySelector('.hero')
    const targets = []
    GROUPS.forEach((group) => {
      const [sel, gap, flat] = Array.isArray(group) ? group : [group, STAGGER]
      const byParent = new Map()
      document.querySelectorAll(sel).forEach((el) => {
        if (hero.contains(el)) return
        const key = flat ? sel : el.parentElement
        const i = byParent.get(key) || 0
        byParent.set(key, i + 1)
        el.classList.add('reveal')
        el.style.setProperty('--reveal-delay', `${Math.min(i, 5) * gap}s`)
        targets.push(el)
      })
    })
    // AI replies below the hero type in word by word
    const writers = [...document.querySelectorAll('[data-typewriter]')].filter((el) => !hero.contains(el))
    writers.forEach(twPrep)
    if (reducedMotion || !('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('is-visible'))
      writers.forEach((el) => twType(el))
      return
    }

    // Strict top-to-bottom order: one queue in document order. An item plays once it (or anything
    // below it) has scrolled into view, and never before everything above it has played. A typed
    // reply holds the queue until its last word lands, so content under it always comes after.
    const items = [
      ...targets.map((el) => ({ el, kind: 'reveal' })),
      ...writers.map((el) => ({ el, kind: 'type' })),
    ].sort((a, b) => (a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
    items.forEach((it, i) => {
      it.i = i
      it.el._seq = it
    })
    let next = 0,
      busy = false,
      open = false,
      typing = null
    // Nothing below the hero plays until the visitor has actually scrolled (a reload mid-page counts)
    let scrolled = scrollY > 0
    // Chat example cards stagger within each batch that comes into view, so every row plays left then right
    const CARD_STAGGER = 0.15
    const pump = () => {
      if (!open || !scrolled || busy) return
      let cardBatch = 0
      while (next < items.length && items[next].ready) {
        const it = items[next++]
        // Scrolled past before its turn (fully above the viewport): show it as it ends up, so scrolling back never finds a gap
        if (it.el.getBoundingClientRect().bottom < 0) {
          if (it.kind === 'type') {
            twType(it.el)
            it.el._tw.finish()
          } else {
            it.el.style.setProperty('--reveal-delay', '0s')
            it.el.classList.add('is-visible')
          }
          continue
        }
        if (it.kind === 'reveal') {
          if (it.el.matches('.ex-card')) it.el.style.setProperty('--reveal-delay', `${cardBatch++ * CARD_STAGGER}s`)
          it.el.classList.add('is-visible')
          continue
        }
        busy = true
        typing = it
        twType(it.el, {
          start: parseFloat(it.el.dataset.twDelay || '0.5') * 1000,
          rate: twRate(it.el),
          onDone: () => {
            busy = false
            typing = null
            pump()
          },
        })
        return
      }
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return
          for (let k = 0; k <= e.target._seq.i; k++) items[k].ready = true // anything above counts as reached
          io.unobserve(e.target)
        })
        pump()
      },
      { threshold: 0.1, rootMargin: '0px 0px -4% 0px' },
    )
    items.forEach((it) => io.observe(it.el))
    // At the very bottom the last items (footer) can sit inside the -4% margin, so treat everything as reached
    const atBottom = () => {
      if (innerHeight + scrollY < document.documentElement.scrollHeight - 4) return
      items.forEach((it) => {
        it.ready = true
      })
      pump()
    }
    addEventListener('scroll', atBottom, { passive: true })
    // Scrolling on down while a headline or reply types finishes that one block at once, so the next ones can play as
    // usual (fade-in, typing). It counts from where the page was when its first word landed, and only 40px further down,
    // so the scroll that brings it in doesn't finish it before it's seen.
    let typedFrom = null
    addEventListener(
      'scroll',
      () => {
        if (!typing) {
          typedFrom = null
          return
        }
        if (typing.el.getBoundingClientRect().bottom < 0) {
          typing.el._tw.finish?.()
          return
        } // scrolled right past it
        if (!typing.el.querySelector('.tw-w.is-on')) return // still in its start delay
        if (typedFrom === null || typedFrom.el !== typing.el) typedFrom = { el: typing.el, y: scrollY }
        if (scrollY - typedFrom.y > 40) typing.el._tw.finish?.()
      },
      { passive: true },
    )
    // Nothing below the hero starts until the hero's answer and connect block are in
    document.addEventListener('hero:answered', (e) => {
      if (!open) {
        open = true
        setTimeout(pump, e.detail?.skipped ? 0 : 700)
      }
    })
    const onFirstScroll = () => {
      if (scrollY <= 0) return
      scrolled = true
      removeEventListener('scroll', onFirstScroll)
      pump()
    }
    if (!scrolled) addEventListener('scroll', onFirstScroll, { passive: true })
  })()

  /* ── Devices stage: scale the 1548×857 artboard to fit ── */
  const stageWrap = document.getElementById('stage-wrap')
  // Cover the wrap (it is taller than the artboard ratio on phones), centred; --stage-vis is the visible artboard width
  const fitStage = () => {
    const { width: w, height: h } = stageWrap.getBoundingClientRect(),
      s = Math.max(w / 1548, h / 857)
    stageWrap.style.setProperty('--stage-scale', s)
    stageWrap.style.setProperty('--stage-x', `${(w - 1548 * s) / 2}px`)
    stageWrap.style.setProperty('--stage-vis', w / s)
  }
  new ResizeObserver(fitStage).observe(stageWrap)
  fitStage()

  // "For example" bracket: its side lines run down to the top of the slider photo, however the copy wraps
  // (offsets, so the reveal's translate doesn't skew it)
  {
    const devices = stageWrap.closest('.devices'),
      bracket = devices.querySelector('.bracket'),
      lines = bracket.querySelector('.bracket-lines')
    const reach = () => {
      lines.style.height = `${Math.max(0, stageWrap.offsetTop - bracket.offsetTop - lines.offsetTop)}px`
    }
    new ResizeObserver(reach).observe(devices)
    reach()
  }
  /* ── Devices slideshow: autoplays, the active dot's fill is the timer (its animationend advances) ── */
  ;(() => {
    const scenes = [...stageWrap.querySelectorAll('.scene')]
    scenes.forEach((s) => s.style.setProperty('--kb', `${Number(s.dataset.dur) + 0.6}s`)) // Ken Burns spans the slide + its crossfade
    const nav = document.getElementById('stage-nav')
    const dots = [...nav.querySelectorAll('.stage-dot')]
    const play = nav.querySelector('.stage-play')
    let cur = 0,
      prevTimer
    // Slide inputs type their question like the hero composer: words rise in, caret follows, then send is tapped.
    // data-bold is an optional bold first line (slide 3), typed before data-question on the line below.
    let typeTimers = []
    const typeQuestion = (scene) => {
      const comp = scene.querySelector('.composer[data-question]')
      if (!comp) return
      const compText = comp.querySelector('.typed-text'),
        compSend = comp.querySelector('.send')
      typeTimers.forEach(clearTimeout)
      typeTimers = []
      compText.textContent = ''
      compSend.classList.remove('is-pressed')
      comp.classList.remove('is-typing')
      comp.classList.add('is-empty')
      const words = typedWords(comp.dataset.question),
        bold = words.filter(([, b]) => b),
        START = 700,
        RATE = 85
      const at = (fn, ms) => typeTimers.push(setTimeout(fn, ms))
      at(() => comp.classList.add('is-typing'), START)
      words.forEach(([word, isBold, space], i) =>
        at(
          () => {
            if (i && i === bold.length) compText.appendChild(document.createElement('br'))
            const span = document.createElement('span')
            span.className = isBold ? 'word is-bold' : 'word'
            span.textContent = word
            if (space && i !== bold.length) compText.appendChild(document.createTextNode(space)) // plain space: wrapped lines don't start with one
            compText.appendChild(span)
            comp.classList.remove('is-empty')
          },
          START + i * RATE,
        ),
      )
      const typed = START + words.length * RATE
      at(() => comp.classList.remove('is-typing'), typed)
      at(() => compSend.classList.add('is-pressed'), typed + 450)
    }
    let typedOnce = false
    const startDot = () => {
      const dot = dots[cur],
        fill = dot.querySelector('.fill')
      dot.style.setProperty('--slide-dur', `${scenes[cur].dataset.dur}s`)
      dot.classList.add('is-active')
      dot.setAttribute('aria-current', 'true')
      fill.style.animation = 'none'
      void fill.offsetWidth
      fill.style.animation = '' // restart the fill
    }
    // Slide 4 (the phone): bubble, agent tag, then the reply types — replayed each time the slide comes round
    const phone = stageWrap.querySelector('.scene-c .phone'),
      phoneReply = phone && phone.querySelector('.agent-msg.is-tight .body p')
    if (phoneReply) twPrep(phoneReply)
    const playPhone = () => {
      phone.classList.remove('is-replying')
      void phone.offsetWidth
      phone.classList.add('is-replying')
      twType(phoneReply, { start: 1500 })
    }
    // Slide 2 (the desk window): question bubble, agent tag, then the reply types — replayed each time the slide comes round
    const desk = stageWrap.querySelector('.scene-b .desk-window')
    const deskParts = desk ? [...desk.querySelectorAll('.agent-msg .body > p')].map((p) => [p, p.textContent]) : []
    const deskBox = desk?.querySelector('.agent-msg .box'),
      deskDot = desk?.querySelector('.agent-msg > .dot')
    let deskTimers = []
    const playDesk = () => {
      deskTimers.forEach(clearTimeout)
      deskTimers = []
      desk.classList.remove('is-replying')
      void desk.offsetWidth
      desk.classList.add('is-replying')
      if (reducedMotion) {
        deskParts.forEach(([el, text]) => {
          el.textContent = text
        })
        deskBox.style.opacity = '1'
        deskDot.style.visibility = ''
        return
      }
      // The gray box keeps its finished size while it types (plus room for the caret)
      deskBox.style.width = ''
      deskBox.textContent = deskParts.find(([el]) => el === deskBox)[1]
      deskBox.style.width = `${Math.min(deskBox.parentElement.clientWidth, deskBox.offsetWidth + 12)}px`
      deskParts.forEach(([el]) => {
        el.textContent = ''
      })
      deskBox.style.opacity = '0'
      deskDot.style.visibility = 'hidden'
      const cursor = Object.assign(document.createElement('span'), { className: 'dot is-inline' })
      const t = typeParts(deskParts, deskBox, cursor, 1450, deskTimers)
      deskTimers.push(
        setTimeout(() => {
          cursor.remove()
          deskDot.style.visibility = ''
        }, t + 100),
      )
    }
    const go = (i) => {
      const old = scenes[cur]
      clearTimeout(prevTimer)
      scenes.forEach((s) => s.classList.remove('is-prev'))
      old.classList.remove('is-active')
      old.classList.add('is-prev')
      typeQuestion(scenes[i])
      if (phone && scenes[i].contains(phone)) playPhone()
      if (desk && scenes[i].contains(desk)) playDesk()
      scenes[i].classList.add('is-active')
      prevTimer = setTimeout(() => old.classList.remove('is-prev'), 650)
      dots[cur].classList.remove('is-active')
      dots[cur].removeAttribute('aria-current')
      cur = i
      startDot()
    }
    const setPaused = (paused) => {
      nav.classList.toggle('is-paused', paused)
      play.setAttribute('aria-label', tr(paused ? 'playSlideshow' : 'pauseSlideshow'))
    }
    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        if (i !== cur) go(i)
        setPaused(false)
      })
      dot.querySelector('.fill').addEventListener('animationend', () => go((cur + 1) % scenes.length))
    })
    play.addEventListener('click', () => setPaused(!nav.classList.contains('is-paused')))
    // Hold the timer while the slideshow is off screen
    nav.classList.add('is-idle')
    // First time it's in view and revealed: type slide 1's question and restart its timer so the slide gets its full time
    let inView = false
    const firstLook = () => {
      if (typedOnce || !inView || cur !== 0 || !stageWrap.classList.contains('is-visible')) return
      typedOnce = true
      typeQuestion(scenes[0])
      startDot()
    }
    new IntersectionObserver(
      ([e]) => {
        inView = e.isIntersecting
        nav.classList.toggle('is-idle', !inView || !stageWrap.classList.contains('is-visible'))
        firstLook()
      },
      { threshold: 0.35 },
    ).observe(stageWrap)
    new MutationObserver(() => {
      nav.classList.toggle('is-idle', !inView || !stageWrap.classList.contains('is-visible'))
      firstLook()
    }).observe(stageWrap, { attributes: true, attributeFilter: ['class'] })
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) setPaused(true)
    startDot()
  })()

  /* ── Autopilot cards: three examples each; click the card for the next, or a dot to jump ──
     The first example is the one in the markup. A card only switches once its first reply has typed,
     so the page's top-to-bottom reveal queue (which waits on that typing) is never cut short. */
  ;(() => {
    // Each row's two extra examples come from the copy (ap1More1Q / ap1More1A …)
    const MORE = [1, 2, 3].map((r) => [1, 2].map((m) => ({ q: tr(`ap${r}More${m}Q`), a: tr(`ap${r}More${m}A`) })))
    document.querySelectorAll('.ap-row').forEach((row, r) => {
      const card = row.querySelector('.ap-card'),
        bubble = card.querySelector('.chat-bubble'),
        reply = card.querySelector('.agent-msg p')
      if (!MORE[r]) return
      const examples = [{ q: bubble.textContent, a: reply.textContent }, ...MORE[r]]
      let cur = 0,
        ready = false,
        timer,
        auto = 0,
        visible = false
      card.classList.add('is-carousel')
      const dots = document.createElement('div')
      dots.className = 'ap-dots'
      dots.setAttribute('role', 'group')
      dots.setAttribute('aria-label', tr('apExamplesAria'))
      dots.innerHTML = examples
        .map(
          (_, i) =>
            `<button type="button" class="ap-dot${i ? '' : ' is-active'}" aria-label="${tr('apExampleOf', { n: i + 1, total: examples.length })}"${i ? '' : ' aria-current="true"'}></button>`,
        )
        .join('')
      card.appendChild(dots)
      // Reserve the tallest example's height so the row never jumps
      const reserve = () => {
        const probe = card.cloneNode(true)
        Object.assign(probe.style, {
          position: 'absolute',
          visibility: 'hidden',
          pointerEvents: 'none',
          minHeight: '0',
          width: `${card.offsetWidth}px`,
        })
        card.after(probe)
        const pb = probe.querySelector('.chat-bubble'),
          pa = probe.querySelector('.agent-msg p')
        const tallest = Math.max(
          ...examples.map((ex) => {
            pb.textContent = ex.q
            pa.textContent = ex.a
            return probe.offsetHeight
          }),
        )
        probe.remove()
        card.style.minHeight = `${tallest}px`
      }
      new ResizeObserver(reserve).observe(row)
      reserve()
      // Autoplay: once a reply has typed, the current dot's bar fills over 3s and the next example plays (looping);
      // it waits while the card is off screen
      const AUTO_MS = 3000
      const stopTimer = () => {
        clearTimeout(auto)
        auto = 0
        dots.classList.remove('is-timing')
      }
      const startTimer = () => {
        stopTimer()
        if (reducedMotion || !visible || !reply.classList.contains('is-typed')) return
        void dots.offsetWidth // restart the fill
        dots.classList.add('is-timing')
        auto = setTimeout(() => show((cur + 1) % examples.length), AUTO_MS)
      }
      new IntersectionObserver(
        ([e]) => {
          visible = e.isIntersecting
          if (!visible) stopTimer()
          else if (ready && !auto) startTimer()
        },
        { threshold: 0.5 },
      ).observe(card)
      // A reply has finished typing once it carries .is-typed (the reveal queue's first one, a carousel step, or an instant
      // finish on scroll); that starts the timer
      let wasTyped = false
      new MutationObserver(() => {
        const typed = reply.classList.contains('is-typed')
        if (typed && !wasTyped) {
          ready = true
          startTimer()
        }
        wasTyped = typed
      }).observe(reply, { attributes: true, attributeFilter: ['class'] })
      const show = (i) => {
        if (!ready || i === cur) return
        cur = i
        stopTimer()
        dots.querySelectorAll('.ap-dot').forEach((d, k) => {
          d.classList.toggle('is-active', k === i)
          d.toggleAttribute('aria-current', k === i)
        })
        card.classList.add('is-switching')
        clearTimeout(timer)
        timer = setTimeout(() => {
          const ex = examples[i]
          bubble.textContent = ex.q
          // Re-split the reply into words for the typewriter
          if (reply._tw) {
            reply._tw.timers.forEach(clearTimeout)
            delete reply._tw
          }
          reply.classList.remove('tw', 'is-typed')
          reply.textContent = ex.a
          twPrep(reply)
          card.classList.remove('is-switching')
          // Replay the entrance in order: bubble bounce, "Sent by you", "Your AI agent", then the reply types
          ;[bubble, card.querySelector('.sent'), card.querySelector('.agent-msg .agent-tag')].forEach(
            (el) =>
              el &&
              el.getAnimations().forEach((a) => {
                if (a.animationName) {
                  a.cancel()
                  a.play()
                }
              }),
          )
          twType(reply, { start: 1150 })
        }, 220)
      }
      card.addEventListener('click', (e) => {
        const dot = e.target.closest('.ap-dot')
        if (dot) {
          show([...dots.children].indexOf(dot))
          return
        }
        if (getSelection().toString()) return // let people select text
        show((cur + 1) % examples.length)
      })
    })
  })()

  /* ── Cursor grid: cells light up under the pointer with an ordered-dither fill and fade; clicks send a
     square ring out across the grid. Every lit cell picks a random dither variant, brightness and fade, and
     every ring a random speed and strength, so no two passes look the same.
     Mouse/trackpad only for the trail (taps still ripple); off entirely for reduced motion.
     o.mount()  → the canvases to draw into (the first is drawn, the rest mirror it)
     o.area()   → where the canvases sit and their size, in their offset parent's px (default: the host)
     o.point(e) → pointer position in canvas px (default: relative to the host and area) */
  const cursorGrid = (host, o) => {
    if (reducedMotion) return null
    const fine = matchMedia('(hover: hover) and (pointer: fine)').matches
    const canvases = o.mount().map((cv) => {
      cv.classList.add('cursor-grid')
      cv.setAttribute('aria-hidden', 'true')
      return cv
    })
    const ctx = canvases[0].getContext('2d'),
      mirrors = canvases.slice(1).map((cv) => cv.getContext('2d'))
    const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5],
      LEVELS = 16,
      VARIANTS = 8
    // Cells at half the configured size (twice the columns); ripples keep their on-screen speed and dots shrink to suit
    const DENSITY = 2
    const rand = (a, b) => a + Math.random() * (b - a)
    const area =
      o.area ||
      (() => {
        const r = host.getBoundingClientRect()
        return { x: 0, y: 0, w: r.width, h: r.height }
      })
    let box = { x: 0, y: 0, w: 0, h: 0 },
      cell = 0,
      cols = 0,
      rows = 0,
      tiles = []
    let heat = new Float32Array(0),
      out = new Float32Array(0),
      life = new Float32Array(0),
      variant = new Uint8Array(0)
    let rings = [],
      raf = 0,
      prevT = 0,
      last = null,
      inView = false
    // Dither variants: the 4x4 Bayer pattern shifted by a random phase, some transposed; one tile per level each
    const buildTiles = () => {
      const size = Math.ceil(cell) + 1,
        px = Math.max(1, Math.round((o.px / DENSITY) * 1.4))
      tiles = []
      for (let v = 0; v < VARIANTS; v++) {
        const ox = Math.floor(rand(0, 4)),
          oy = Math.floor(rand(0, 4)),
          flip = Math.random() < 0.5,
          set = [null]
        for (let l = 1; l <= LEVELS; l++) {
          const t = document.createElement('canvas')
          t.width = t.height = size
          const c = t.getContext('2d')
          c.fillStyle = o.color
          if (l === LEVELS) c.fillRect(0, 0, size, size)
          else
            for (let y = 0; y * px < size; y++)
              for (let x = 0; x * px < size; x++) {
                const bx = (x + ox) & 3,
                  by = (y + oy) & 3
                if (BAYER[(flip ? bx : by) * 4 + (flip ? by : bx)] < l) c.fillRect(x * px, y * px, px, px)
              }
          set.push(t)
        }
        tiles.push(set)
      }
    }
    const layout = () => {
      const b = area(),
        w = Math.round(b.w),
        h = Math.round(b.h)
      if (!w || !h) return
      if (w === Math.round(box.w) && h === Math.round(box.h) && b.x === box.x && b.y === box.y) return
      box = b
      cols = o.cols(w) * DENSITY
      cell = w / cols
      rows = Math.ceil(h / cell)
      heat = new Float32Array(cols * rows)
      out = new Float32Array(cols * rows)
      life = new Float32Array(cols * rows).fill(1)
      variant = new Uint8Array(cols * rows)
      canvases.forEach((cv) => {
        cv.width = w
        cv.height = h
        Object.assign(cv.style, { left: `${b.x}px`, top: `${b.y}px`, width: `${w}px`, height: `${h}px` })
      })
      buildTiles()
      draw()
    }
    const draw = () => {
      const w = canvases[0].width,
        h = canvases[0].height
      ctx.clearRect(0, 0, w, h)
      for (let j = 0; j < rows; j++)
        for (let i = 0; i < cols; i++) {
          const n = j * cols + i,
            v = out[n]
          if (!v) continue
          const x0 = Math.round(i * cell),
            y0 = Math.round(j * cell),
            cw = Math.round((i + 1) * cell) - x0,
            ch = Math.round((j + 1) * cell) - y0
          ctx.globalAlpha = o.alpha
          ctx.drawImage(
            tiles[variant[n]][Math.min(LEVELS, Math.ceil(v * LEVELS))],
            0,
            0,
            cw - 1,
            ch - 1,
            x0 + 1,
            y0 + 1,
            cw - 1,
            ch - 1,
          )
          ctx.globalAlpha = Math.min(1, v * o.edge)
          ctx.strokeStyle = o.color
          ctx.lineWidth = 1
          ctx.strokeRect(x0 + 0.5, y0 + 0.5, cw, ch)
        }
      ctx.globalAlpha = 1
      mirrors.forEach((m) => {
        m.clearRect(0, 0, w, h)
        m.drawImage(canvases[0], 0, 0)
      })
    }
    // Ring profile: a bright one-cell band at the wavefront with a soft tail behind it
    const band = (d) => (d < 0 ? Math.max(0, 1 + d / (cell * 0.6)) : Math.exp(-d / (cell * 1.1)))
    const frame = (ts) => {
      raf = 0
      if (!inView) return
      const t = ts / 1000,
        dt = prevT ? Math.min(0.05, t - prevT) : 1 / 60
      prevT = t
      let live = false
      for (let n = 0; n < heat.length; n++) {
        let v = heat[n]
        if (v) {
          v *= Math.exp(-dt / (o.fade * life[n]))
          if (v < 0.02) v = 0
          heat[n] = v
          if (v) live = true
        }
        out[n] = v
      }
      rings = rings.filter((g) => {
        const rad = (t - g.t) * g.speed,
          age = rad / g.reach
        if (age > 1.15) return false
        live = true
        if (rad < 0) return true
        const amp = g.amp * Math.max(0, 1 - age * age)
        const j0 = Math.max(0, Math.floor((g.y - rad - cell) / cell)),
          j1 = Math.min(rows - 1, Math.floor((g.y + rad + cell * 5) / cell))
        for (let j = j0; j <= j1; j++)
          for (let i = 0; i < cols; i++) {
            // Square wavefront: distance is the larger of the two axis offsets
            const dx = (i + 0.5) * cell - g.x,
              dy = (j + 0.5) * cell - g.y,
              d = rad - Math.max(Math.abs(dx), Math.abs(dy))
            if (d < -cell || d > cell * 4) continue
            const n = j * cols + i,
              v = band(d) * amp
            if (v > out[n]) {
              out[n] = v
              if (!heat[n]) variant[n] = (n * 7 + g.seed) % VARIANTS
            }
          }
        return true
      })
      draw()
      if (live) raf = requestAnimationFrame(frame)
      else prevT = 0
    }
    const wake = () => {
      if (!raf && inView) raf = requestAnimationFrame(frame)
    }
    const stamp = (x, y, v) => {
      const i = Math.floor(x / cell),
        j = Math.floor(y / cell)
      if (i < 0 || j < 0 || i >= cols || j >= rows) return
      const n = j * cols + i
      if (heat[n] < 0.05) {
        variant[n] = Math.floor(rand(0, VARIANTS))
        life[n] = rand(0.7, 1.4)
      } // a fresh cell rolls its own look
      v *= rand(0.8, 1)
      if (v > heat[n]) heat[n] = v
    }
    const point =
      o.point ||
      ((e) => {
        const r = host.getBoundingClientRect()
        return [e.clientX - r.left - box.x, e.clientY - r.top - box.y]
      })
    const ring = (x, y, amp = 1, reach = o.reach, delay = 0) => {
      if (!cols) return
      rings.push({
        x,
        y,
        amp: amp * rand(0.8, 1.15),
        reach: reach * cell * rand(0.85, 1.15),
        speed: o.speed * DENSITY * cell * rand(0.8, 1.2),
        seed: Math.floor(rand(0, VARIANTS)),
        t: performance.now() / 1000 + delay,
      })
      if (rings.length > 6) rings.shift()
      wake()
    }
    // The eight cells around the pointer show at 10% opacity
    const around = 0.1 / o.alpha
    if (fine) {
      host.addEventListener(
        'pointermove',
        (e) => {
          if (e.pointerType === 'touch') return
          const [x, y] = point(e)
          // Fill the gap since the last sample so a fast swipe still leaves a continuous trail
          const steps = last ? Math.min(30, Math.ceil(Math.hypot(x - last[0], y - last[1]) / (cell * 0.5)) || 1) : 1
          for (let s = 1; s <= steps; s++) {
            const px = last ? last[0] + ((x - last[0]) * s) / steps : x,
              py = last ? last[1] + ((y - last[1]) * s) / steps : y
            for (let oy = -1; oy <= 1; oy++)
              for (let ox = -1; ox <= 1; ox++) if (ox || oy) stamp(px + ox * cell, py + oy * cell, around)
            stamp(px, py, 1)
          }
          last = [x, y]
          wake()
        },
        { passive: true },
      )
      host.addEventListener('pointerleave', () => {
        last = null
      })
    }
    host.addEventListener(
      'click',
      (e) => {
        if (!e.detail) return
        const [x, y] = point(e)
        if (x < 0 || y < 0 || x > box.w || y > box.h) return
        ring(x, y, 1, o.clickReach)
      },
      { passive: true },
    )
    new IntersectionObserver(
      ([e]) => {
        inView = e.isIntersecting
        if (inView) {
          layout()
          o.onView?.()
          wake()
        }
      },
      { threshold: 0.15 },
    ).observe(host)
    new ResizeObserver(layout).observe(host)
    if (o.idle)
      setInterval(() => {
        if (!inView || document.hidden || !cols || rings.length) return
        ring((Math.floor(Math.random() * cols) + 0.5) * cell, (Math.floor(Math.random() * rows) + 0.5) * cell, 0.45, 6)
      }, o.idle * rand(0.8, 1.2))
    return { ring, size: () => ({ w: box.w, h: box.h }) }
  }

  // Hero: white cells over the video, under the input and chat; a ring leaves the cube as the chat comes in
  const heroGrid = cursorGrid(hero, {
    mount: () => {
      const cv = document.createElement('canvas')
      hero.querySelector('.hero-fade').after(cv)
      return [cv]
    },
    cols: (w) => (w >= 1280 ? 36 : w >= 992 ? 30 : w >= 768 ? 22 : 12),
    px: 3,
    color: '#fff',
    alpha: 0.32,
    edge: 0.45,
    fade: 0.3,
    speed: 18,
    reach: 12,
    clickReach: 10,
  })
  if (heroGrid)
    new MutationObserver(() => {
      if (hero.dataset.intro !== 'done') return
      const cubeY = parseFloat(hero.style.getPropertyValue('--cube-y')) || heroGrid.size().h / 3
      const lift = parseFloat(hero.style.getPropertyValue('--cube-lift')) || 0
      heroGrid.ring(heroGrid.size().w / 2, cubeY + lift, 0.6, 14, 0.35)
    }).observe(hero, { attributes: true, attributeFilter: ['data-intro'] })

  // White sections, image backgrounds only: white cells over the warehouse photo (under the example cards)…
  const exStage = document.querySelector('.examples-stage'),
    exPhoto = exStage?.querySelector('.examples-photo')
  const exBg = exPhoto?.parentElement
  // The photo is centred with left: 50% and translateX(-50%), so read its box from offsets (within its moving wrapper)
  const exArea = () => ({
    x: exPhoto.offsetLeft - exPhoto.offsetWidth / 2,
    y: exPhoto.offsetTop,
    w: exPhoto.offsetWidth,
    h: exPhoto.offsetHeight,
  })
  if (exPhoto)
    cursorGrid(exStage, {
      mount: () => {
        const cv = document.createElement('canvas')
        exBg.append(cv)
        return [cv]
      }, // over every row's photo
      area: exArea,
      // The wrapper slides between rows, so measure the pointer from where it is now
      point: (e) => {
        const r = exBg.getBoundingClientRect(),
          a = exArea()
        return [e.clientX - r.left - a.x, e.clientY - r.top - a.y]
      },
      cols: (w) => (w >= 1280 ? 36 : w >= 992 ? 30 : w >= 768 ? 22 : 12),
      px: 3,
      color: '#fff',
      alpha: 0.32,
      edge: 0.45,
      fade: 0.3,
      speed: 18,
      reach: 10,
      clickReach: 10,
    })
  // Step the photo down with the scroll: it moves to a row as soon as that row's top comes 30% up from the bottom of the viewport
  // (scrolling down) and back once it drops below, offset from that row as it is from the first, less 100px so more of it
  // shows behind the row above; at the last row it hangs 150px below the cards. Each row brings in its own photo
  // (rows split into thirds when the cards stack in one column)
  if (exBg) {
    const cards = [...exStage.querySelectorAll('.ex-card')],
      alts = [...exBg.querySelectorAll('.examples-alt')]
    const shades = [...exBg.querySelectorAll('.examples-shade')]
    let raf = 0,
      photo = 0,
      scrolling = false,
      settle = 0
    const shade = () =>
      shades.forEach((img, i) =>
        img.classList.toggle('is-on', scrolling && i === photo && exPhoto.matches(':not(.reveal), .is-visible')),
      )
    const step = () => {
      raf = 0
      const rows = [...new Set(cards.map((c) => c.offsetTop))].sort((a, b) => a - b)
      if (!rows.length) return
      const line = innerHeight * 0.7,
        stageTop = exStage.getBoundingClientRect().top
      let best = 0
      rows.forEach((t, i) => {
        if (stageTop + t < line) best = i
      })
      const last = Math.max(0, exStage.offsetHeight + 150 - exBg.offsetHeight)
      const RISE = 100 // the photo's extra 100px goes above the row it steps to
      exStage.style.setProperty(
        '--bg-y',
        `${best === rows.length - 1 ? last : Math.min(last, Math.max(0, rows[best] - rows[0] - (best ? RISE : 0)))}px`,
      )
      photo = Math.min(alts.length, Math.floor((best * (alts.length + 1)) / rows.length))
      alts.forEach((img, i) => img.classList.toggle('is-on', i < photo))
      shade()
    }
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(step)
    }
    const onScroll = () => {
      scrolling = true
      queue()
      clearTimeout(settle)
      settle = setTimeout(() => {
        scrolling = false
        shade()
      }, 180)
    }
    addEventListener('scroll', onScroll, { passive: true })
    addEventListener('resize', queue)
    step()
  }
  // …and over the desk/dock slider photos: one grid mirrored into each slide, between its photo and its chat UI.
  // The slides live in the scaled 1548×857 artboard, so the canvases use artboard px.
  const deviceStage = stageWrap.querySelector('.stage')
  cursorGrid(stageWrap, {
    mount: () =>
      [...deviceStage.querySelectorAll('.scene .photo')].map((photo) => {
        const cv = document.createElement('canvas')
        photo.after(cv)
        return cv
      }),
    area: () => ({ x: 0, y: 0, w: 1548, h: 857 }),
    point: (e) => {
      const r = deviceStage.getBoundingClientRect(),
        k = r.width / 1548
      return [(e.clientX - r.left) / k, (e.clientY - r.top) / k]
    },
    cols: () => 36,
    px: 4,
    color: '#fff',
    alpha: 0.32,
    edge: 0.45,
    fade: 0.3,
    speed: 18,
    reach: 10,
    clickReach: 10,
  })

  // White areas: soft gray cells everywhere else on the page (under the photos' own white grids), and in the
  // hero where the video has faded to white
  const SOFT = {
    px: 3,
    color: '#8b929c',
    alpha: 0.3,
    edge: 0.35,
    fade: 0.3,
    speed: 18,
    reach: 10,
    clickReach: 10,
    cols: (w) => (w >= 1280 ? 36 : w >= 992 ? 30 : w >= 768 ? 22 : 12),
  }
  cursorGrid(hero, {
    ...SOFT,
    mount: () => {
      const cv = document.createElement('canvas')
      hero.querySelector('.hero-fade').after(cv)
      cv.classList.add('is-soft')
      // …mirrored above the chat card's glass, shifted back by the card's offset so its cells sit on the hero's
      const card = hero.querySelector('.chat-app'),
        wrap = Object.assign(document.createElement('div'), { className: 'chat-grid' })
      const mirror = document.createElement('canvas')
      wrap.append(mirror)
      card.querySelector('.chat-shadow').after(wrap)
      const align = () => {
        let x = 0,
          y = 0,
          n = card
        while (n && n !== hero) {
          x += n.offsetLeft
          y += n.offsetTop
          n = n.offsetParent
        }
        mirror.style.translate = `${-x}px ${-y}px`
      }
      new ResizeObserver(align).observe(hero)
      align()
      return [cv, mirror]
    },
  })
  document.querySelectorAll('.features, .examples, .devices-head, .devices, .cta').forEach((sec) => {
    sec.classList.add('has-soft-grid')
    cursorGrid(sec, {
      ...SOFT,
      mount: () => {
        const cv = document.createElement('canvas')
        sec.prepend(cv)
        return [cv]
      },
    })
  })

  // Dark sections: accent green cells (no resting grid: cells only show around the cursor), a ring from the headline when first seen,
  // and an occasional idle ring
  document.querySelectorAll('.on-dark').forEach((sec) => {
    let seen = false,
      grid
    grid = cursorGrid(sec, {
      mount: () => {
        const cv = document.createElement('canvas')
        sec.prepend(cv)
        return [cv]
      },
      cols: (w) => (w >= 992 ? 20 : w >= 768 ? 14 : 9),
      px: 3,
      color: '#00ff1a',
      alpha: 0.45,
      edge: 0.5,
      fade: 0.32,
      speed: 16,
      reach: 10,
      clickReach: 12,
      idle: 5200,
      onView: () => {
        if (seen || !grid) return
        seen = true
        const t = sec.querySelector('.display'),
          r = t ? t.getBoundingClientRect() : null,
          s = sec.getBoundingClientRect()
        grid.ring(
          r ? r.left - s.left + r.width / 2 : s.width / 2,
          r ? r.top - s.top + r.height / 2 : s.height / 3,
          0.7,
          14,
          0.4,
        )
      },
    })
  })

  /* ── "Pattern Screen" shader (Figma custom effect, wavy lines) on the device photos ──
     setup()/render() below are the Figma shader module (unused param helpers trimmed), with one addition:
     an ambient iridescent ripple. Wide rings spread out from the chat UI on top of the photo (input pill, laptop window, phone),
     in its rounded-box shape, bending the lines and tinting them with a cool thin-film sheen (cyan, blue, violet, mint) and a slight
     red/blue split along each crest. frameData.x is time, frameData.w the ripple amount; rippleBox is that object (centre xy,
     half size zw, output px) and rippleShape.x its corner radius. */
  const PatternScreen = (() => {
    function setup(device, frame) {
      var wgsl = `
  diagnostic(off,derivative_uniformity);
  struct Uniforms {
    frameData: vec4f,
    inputDimsData: vec4f,
    patternMode: vec4f,
    patternScale: vec4f,
    tintColor: vec4f,
    bgColor: vec4f,
    contrast: vec4f,
    patternAngle: vec4f,
    rippleBox: vec4f,
    rippleShape: vec4f,
  };
  @group(0) @binding(0) var<uniform> u: Uniforms;
  @group(0) @binding(1) var samp: sampler;
  @group(0) @binding(2) var inputTex: texture_2d<f32>;

  struct VsIn {
    @location(0) pos: vec2f,
    @location(1) uv: vec2f,
  };
  struct VsOut {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
  };

  fn sampleInput(p: vec2f) -> vec4f {
    return textureSampleLevel(inputTex, samp, clamp(p, vec2f(0.0), vec2f(1.0)), 0.0);
  }

  // Like sampleInput but returns transparent (premultiplied zero) outside the
  // input rect instead of repeating the edge texel.
  fn sampleInputOrZero(p: vec2f) -> vec4f {
    let inside = step(vec2f(0.0), p) * step(p, vec2f(1.0));
    return sampleInput(p) * (inside.x * inside.y);
  }

  // Chromatic split helpers: brightness and the wavy-line pattern at any pixel position
  fn lumAt(p: vec2f, dims: vec2f, contrast: f32) -> f32 {
    let c = sampleInput(p / dims);
    let lum = dot(c.rgb / max(c.a, 0.0001), vec3f(0.299, 0.587, 0.114));
    return clamp(pow(lum, 1.0 / max(contrast, 0.01)), 0.0, 1.0);
  }
  fn wavyAt(p: vec2f, cellSize: f32, l: f32) -> f32 {
    let cell = p / cellSize;
    let yOff = fract(cell.y) + sin(cell.x * 6.2831853) * 0.15;
    return select(0.0, 1.0, abs(fract(yOff) - 0.5) < l * 0.5);
  }

  fn rotateUV(p: vec2f, angle: f32) -> vec2f {

    let c = cos(angle);

    let s = sin(angle);

    return vec2f(p.x * c - p.y * s, p.x * s + p.y * c);

  }

  @vertex fn vs_main(in: VsIn) -> VsOut {
    var out: VsOut;
    out.position = vec4f(in.pos, 0.0, 1.0);
    out.uv = in.uv;
    return out;
  }

  @fragment fn fs_main(@location(0) outputUv_in: vec2f) -> @location(0) vec4f {
    let time = u.frameData.x;
    let outputUv = outputUv_in;
    let dims = max(u.frameData.yz, vec2f(1.0));
    let inputDims = max(u.inputDimsData.xy, vec2f(1.0));
    let inputTexel = vec2f(1.0) / inputDims;
    let uv = outputUv;
    // texel and aspect are input-relative to match uv. Zoom fills rescale texel
    // alongside their uv redefinition below (see zoomLocal).
    let texel = inputTexel;
    let aspect = inputDims.x / max(inputDims.y, 1.0);
    // patternMode: 0=Vertical lines, 1=Horizontal lines, 2=Crosshatch, 3=Diagonal crosshatch, 4=Square dots, 5=Circle dots, 6=Wavy lines, 7=Diamond checker, 8=Radial lines, 9=Coarse halftone
    let patternMode = i32(u.patternMode.x + 0.5);
    let patternScale = u.patternScale.x;
    let tintColor = u.tintColor;
    let bgColor = u.bgColor;
    let contrast = u.contrast.x;
    let patternAngle = u.patternAngle.x;
    // Ambient ripple off the object on the slide: rings are distance from a rounded box its size and corner radius (SDF),
    // so they hug its outline near it and round out further away; distance is in frame heights
    let ripple = u.frameData.w;
    let px0 = uv * dims;
    let bc = u.rippleBox.xy;
    let bh = max(u.rippleBox.zw, vec2f(1.0));
    let br = min(u.rippleShape.x, min(bh.x, bh.y));
    let bq = abs(px0 - bc) - bh + vec2f(br);
    let sd = length(max(bq, vec2f(0.0))) + min(max(bq.x, bq.y), 0.0) - br;
    let d1 = max(sd, 0.0) / dims.y;
    let ph1 = d1 * 16.0 - time * 1.1;
    let w1 = sin(ph1) * exp(-d1 * 0.9);
    let rdir = normalize(max(bq, vec2f(0.0)) * sign(px0 - bc) + vec2f(0.001));
    let px = px0 + rdir * w1 * (dims.y / 857.0) * 4.0 * ripple;
    let inputColor = sampleInput(px / dims);
    let lum = dot(inputColor.rgb / max(inputColor.a, 0.0001), vec3f(0.299, 0.587, 0.114));
    let l = clamp(pow(lum, 1.0 / max(contrast, 0.01)), 0.0, 1.0);
    let ang = patternAngle * 3.14159265 / 180.0;
    let center = dims * 0.5;
    let rp = rotateUV(px - center, ang) + center;
    let cellSize = patternScale;
    let cell = rp / cellSize;
    let cellFrac = fract(cell);
    var pattern: f32 = 0.0;
    // patternMode: 0=Vertical lines, 1=Horizontal lines, 2=Crosshatch, 3=Diagonal crosshatch,
    // 4=Square dots, 5=Circle dots, 6=Wavy lines, 7=Diamond checker, 8=Radial lines, 9=Coarse halftone
    if (patternMode == 0) {
      // Vertical lines
      pattern = select(0.0, 1.0, abs(cellFrac.x - 0.5) < l * 0.5);
    } else if (patternMode == 1) {
      // Horizontal lines
      pattern = select(0.0, 1.0, abs(cellFrac.y - 0.5) < l * 0.5);
    } else if (patternMode == 2) {
      // Crosshatch
      let h = select(0.0, 1.0, abs(cellFrac.x - 0.5) < l * 0.5);
      let v = select(0.0, 1.0, abs(cellFrac.y - 0.5) < l * 0.5);
      pattern = max(h, v);
    } else if (patternMode == 3) {
      // Diagonal crosshatch — use 45deg rotated coords
      let dp = rotateUV(px - center, ang + 0.7853981) + center;
      let dcf = fract(dp / cellSize);
      let d1 = select(0.0, 1.0, abs(dcf.x - 0.5) < l * 0.5);
      let d2 = select(0.0, 1.0, abs(dcf.y - 0.5) < l * 0.5);
      pattern = max(d1, d2);
    } else if (patternMode == 4) {
      // Square dots
      let half = l * 0.5;
      pattern = select(0.0, 1.0, abs(cellFrac.x - 0.5) < half && abs(cellFrac.y - 0.5) < half);
    } else if (patternMode == 5) {
      // Circle dots
      let dist = length(cellFrac - vec2f(0.5));
      pattern = select(0.0, 1.0, dist < l * 0.5);
    } else if (patternMode == 6) {
      // Wavy lines
      let wave = sin(cell.x * 3.14159265 * 2.0) * 0.15;
      let yOff = cellFrac.y + wave;
      pattern = select(0.0, 1.0, abs(fract(yOff) - 0.5) < l * 0.5);
    } else if (patternMode == 7) {
      // Diamond checker
      let d = abs(cellFrac.x - 0.5) + abs(cellFrac.y - 0.5);
      pattern = select(0.0, 1.0, d < l * 0.5 + 0.25);
    } else if (patternMode == 8) {
      // Radial lines
      let delta = px - center;
      let angle2 = atan2(delta.y, delta.x) + ang;
      let slices = 6.283185 / cellSize;
      let stripe = fract(angle2 / slices);
      pattern = select(0.0, 1.0, abs(stripe - 0.5) < l * 0.5);
    } else {
      // Coarse halftone — larger dots
      let bigCell = cellSize * 2.5;
      let bcf = fract(rp / bigCell);
      let dist2 = length(bcf - vec2f(0.5));
      pattern = select(0.0, 1.0, dist2 < l * 0.45);
    }
    // Iridescence along the ring crests: a hue that shifts with phase, brightness and time
    let crest = pow(clamp(abs(w1), 0.0, 1.0), 1.6) * ripple; // thick crests
    let hue = fract(ph1 * 0.16 + l * 0.35 + time * 0.03);
    // Cool colours only: cyan → blue → violet → mint → cyan (no reds, oranges or yellows)
    let hx = hue * 4.0;
    let cCyan = vec3f(0.0, 0.88, 1.0);
    let cBlue = vec3f(0.27, 0.42, 1.0);
    let cViolet = vec3f(0.58, 0.38, 1.0);
    let cMint = vec3f(0.0, 1.0, 0.62);
    var irid = mix(cMint, cCyan, hx - 3.0);
    if (hx < 1.0) { irid = mix(cCyan, cBlue, hx); }
    else if (hx < 2.0) { irid = mix(cBlue, cViolet, hx - 1.0); }
    else if (hx < 3.0) { irid = mix(cViolet, cMint, hx - 2.0); }
    let fg = mix(tintColor.rgb, irid, crest * 0.175) * tintColor.a;
    let bg = (bgColor.rgb + irid * crest * 0.01) * bgColor.a;
    // Chromatic split: red and blue lines drift apart from green along the ring crests (up to ~0.75px at 1x)
    if (patternMode == 6 && ripple > 0.0 && patternAngle == 0.0) {
      let ca = rdir * pow(abs(w1), 1.2) * (dims.y / 857.0) * 0.75 * ripple;
      let pR = wavyAt(px + ca, cellSize, lumAt(px + ca, dims, contrast));
      let pB = wavyAt(px - ca, cellSize, lumAt(px - ca, dims, contrast));
      let colC = vec3f(mix(bg.r, fg.r, pR), mix(bg.g, fg.g, pattern), mix(bg.b, fg.b, pB));
      let aC = mix(bgColor.a, tintColor.a, max(pattern, max(pR, pB)));
      return vec4f(colC, aC) * inputColor.a;
    }
    let col = mix(bg, fg, pattern);
    let a = mix(bgColor.a, tintColor.a, pattern);
    return vec4f(col, a) * inputColor.a;
  }
  `
      frame.state.module = device.createShaderModule({ code: wgsl })
      frame.state.pipeline = null
      frame.state.pipelineFormat = null
      frame.state.quad = device.createBuffer({
        size: 6 * 4 * 4,
        usage: GPUBufferUsage.VERTEX,
        mappedAtCreation: true,
      })
      new Float32Array(frame.state.quad.getMappedRange()).set([
        -1, -1, 0, 1, 1, -1, 1, 1, -1, 1, 0, 0, -1, 1, 0, 0, 1, -1, 1, 1, 1, 1, 1, 0,
      ])
      frame.state.quad.unmap()
      frame.state.uniformBuf = device.createBuffer({
        size: 160,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      })
      frame.state.sampler = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
        addressModeU: 'clamp-to-edge',
        addressModeV: 'clamp-to-edge',
      })
      frame.state.placeholder = device.createTexture({
        size: [1, 1, 1],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
      })
      device.queue.writeTexture(
        { texture: frame.state.placeholder },
        new Uint8Array([0, 0, 0, 0]),
        { bytesPerRow: 4 },
        { width: 1, height: 1, depthOrArrayLayers: 1 },
      )
    }
    function render(device, frame) {
      var params = frame.params || {}
      function finiteNumber(value, fallback) {
        var num = Number(value)
        return Number.isFinite(num) ? num : fallback
      }
      function numberParam(name, fallback) {
        return finiteNumber(params[name], fallback)
      }
      function selectParam(name, count, fallbackIndex) {
        // A select is a numeric dropdown: params[name] is the chosen option's index.
        var index = Math.round(Number(params[name]))
        return Number.isFinite(index) && index >= 0 && index < count ? index : fallbackIndex
      }
      function colorParam(name, fallback) {
        var value = params[name] || {}
        return [
          finiteNumber(value.r, fallback[0]),
          finiteNumber(value.g, fallback[1]),
          finiteNumber(value.b, fallback[2]),
          finiteNumber(value.a, fallback[3]),
        ]
      }
      var output = frame.output || {}
      var width = Math.max(1, finiteNumber(output.width, 1))
      var height = Math.max(1, finiteNumber(output.height, 1))
      var time = finiteNumber(frame.time, 0)
      var ripple = finiteNumber(frame.ripple, 0)
      var box = frame.box || [width / 2, height / 2, 0, 0, 0, 0, 0, 0]
      var inputWidth = width
      var inputHeight = height
      device.queue.writeBuffer(
        frame.state.uniformBuf,
        0,
        new Float32Array([
          time,
          width,
          height,
          ripple,
          inputWidth,
          inputHeight,
          0,
          0,
          selectParam('patternMode', 10, 5),
          0,
          0,
          0,
          numberParam('patternScale', 8),
          0,
          0,
          0,
          ...colorParam('tintColor', [0, 0.898, 0.627, 1]),
          ...colorParam('bgColor', [0, 0, 0, 1]),
          numberParam('contrast', 1),
          0,
          0,
          0,
          numberParam('patternAngle', 0),
          0,
          0,
          0,
          ...box,
        ]),
      )
      var inputView = frame.input != null ? frame.input.createView() : frame.state.placeholder.createView()
      var outputFormat = frame.output.format
      if (frame.state.pipeline == null || frame.state.pipelineFormat !== outputFormat) {
        frame.state.pipeline = device.createRenderPipeline({
          layout: 'auto',
          vertex: {
            module: frame.state.module,
            entryPoint: 'vs_main',
            buffers: [
              {
                arrayStride: 16,
                attributes: [
                  { shaderLocation: 0, format: 'float32x2', offset: 0 },
                  { shaderLocation: 1, format: 'float32x2', offset: 8 },
                ],
              },
            ],
          },
          fragment: {
            module: frame.state.module,
            entryPoint: 'fs_main',
            targets: [{ format: outputFormat }],
          },
          primitive: { topology: 'triangle-list' },
        })
        frame.state.pipelineFormat = outputFormat
      }
      var bindGroup = device.createBindGroup({
        layout: frame.state.pipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: frame.state.uniformBuf } },
          { binding: 1, resource: frame.state.sampler },
          { binding: 2, resource: inputView },
        ],
      })
      var encoder = device.createCommandEncoder()
      var pass = encoder.beginRenderPass({
        colorAttachments: [
          {
            view: frame.output.createView(),
            loadOp: 'clear',
            clearValue: { r: 0, g: 0, b: 0, a: 0 },
            storeOp: 'store',
          },
        ],
      })
      pass.setPipeline(frame.state.pipeline)
      pass.setBindGroup(0, bindGroup)
      pass.setVertexBuffer(0, frame.state.quad)
      pass.draw(6)
      pass.end()
      device.queue.submit([encoder.finish()])
    }
    return { setup, render }
  })()

  /* Minimal host: feeds the photo (object-fit: cover at the layer's size) in as the input texture at the
     layer's design size. Params match the Figma effect. The ripple re-renders ~30fps, only the slide on show,
     only while the slider is on screen; reduced motion gets the still frame. */
  // Figma 373:4752 (desk) / 373:4751 (dock): one wavy-line screen on every slide
  const SHADER_PARAMS = {
    patternAngle: 0,
    contrast: 1.35,
    bgColor: { r: 0, g: 0, b: 0, a: 1 },
    patternScale: 5.5,
    tintColor: { r: 1, g: 1, b: 1, a: 1 },
    patternMode: 6,
  }
  async function applyPatternScreen() {
    if (!navigator.gpu) {
      console.info('Pattern Screen shader needs WebGPU; showing the unshaded photos.')
      return
    }
    const adapter = await navigator.gpu.requestAdapter()
    if (!adapter) return
    const device = await adapter.requestDevice()
    const format = navigator.gpu.getPreferredCanvasFormat()
    const W = 1548,
      H = 857,
      dpr = Math.min(window.devicePixelRatio || 1, 2)
    for (const layer of document.querySelectorAll('[data-shader]')) {
      const img = layer.querySelector('img.source')
      await img.decode().catch(() => {})
      const w = Math.round(W * dpr),
        h = Math.round(H * dpr)
      // Cover-crop the photo into its CSS box (the whole layer, or the Figma crop on slide 3) on an input canvas the size of the layer
      const src = document.createElement('canvas')
      src.width = w
      src.height = h
      const bx = img.offsetLeft * dpr,
        by = img.offsetTop * dpr,
        bw = img.offsetWidth * dpr,
        bh = img.offsetHeight * dpr
      const s = Math.max(bw / img.naturalWidth, bh / img.naturalHeight)
      const dw = img.naturalWidth * s,
        dh = img.naturalHeight * s
      src.getContext('2d').drawImage(img, bx + (bw - dw) / 2, by + (bh - dh) / 2, dw, dh)
      const input = device.createTexture({
        size: [w, h],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
      })
      device.queue.copyExternalImageToTexture({ source: src }, { texture: input, premultipliedAlpha: true }, [w, h])
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      layer.appendChild(canvas)
      const ctx = canvas.getContext('webgpu')
      ctx.configure({ device, format, alphaMode: 'premultiplied' })
      // patternScale is in output pixels; scale with dpr so the lines match the 1x design
      const frame = {
        state: {},
        params: { ...SHADER_PARAMS, patternScale: SHADER_PARAMS.patternScale * dpr },
        input,
        output: null,
        time: 0,
        ripple: reducedMotion ? 0 : 1,
        box: rippleBox(layer, w),
      }
      PatternScreen.setup(device, frame)
      frame.output = ctx.getCurrentTexture()
      PatternScreen.render(device, frame)
      layer.classList.add('is-shaded')
      shaded.push({ frame, ctx, layer, w, scene: layer.closest('.scene'), last: 0 })
    }
    if (reducedMotion || !shaded.length) return
    let inView = false,
      raf = 0
    const tick = (ts) => {
      raf = 0
      if (!inView || document.hidden) return
      shaded.forEach((s) => {
        if (!s.scene || !s.scene.matches('.is-active, .is-prev') || ts - s.last < 33) return
        s.last = ts
        s.frame.time = ts / 1000
        s.frame.box = rippleBox(s.layer, s.w)
        s.frame.output = s.ctx.getCurrentTexture()
        PatternScreen.render(device, s.frame)
      })
      raf = requestAnimationFrame(tick)
    }
    const wake = () => {
      if (!raf && inView && !document.hidden) raf = requestAnimationFrame(tick)
    }
    new IntersectionObserver(([e]) => {
      inView = e.isIntersecting
      wake()
    }).observe(stageWrap)
    document.addEventListener('visibilitychange', wake)
  }
  const shaded = []
  // The slide's chat UI in its layer's output pixels (centre, half size, corner radius); from on-screen rects, so it tracks the
  // Ken Burns zoom, the UI's rise-in and its mobile scale.
  function rippleBox(layer, w) {
    const obj = layer.closest('.scene').querySelector('.composer, .desk-window, .phone')
    const p = layer.getBoundingClientRect(),
      c = obj && obj.getBoundingClientRect()
    if (!c || !p.width || !obj.offsetWidth) return null
    const k = w / p.width,
      r = parseFloat(getComputedStyle(obj).borderTopLeftRadius) * (c.width / obj.offsetWidth)
    return [
      (c.left + c.width / 2 - p.left) * k,
      (c.top + c.height / 2 - p.top) * k,
      (c.width / 2) * k,
      (c.height / 2) * k,
      r * k,
      0,
      0,
      0,
    ]
  }
  // Heavy GPU/canvas work: run after the hero intro has played
  setTimeout(
    () => applyPatternScreen().catch((err) => console.warn('Pattern Screen shader failed:', err)),
    reducedMotion ? 0 : 3500,
  )

  /* Examples background while scrolling: the current row's photo runs Figma's screen live (Section 3, 373:4784–4786: wavy
     lines on a dark gray base) with the slider's ripple rolling out from the row of cards nearest the middle of the screen.
     It only draws while the scroll swap is showing (and through its fade-out); reduced motion and no-WebGPU keep the PNGs. */
  async function applyExamplesShade() {
    if (!navigator.gpu || reducedMotion || !exBg) return
    const adapter = await navigator.gpu.requestAdapter()
    if (!adapter) return
    const device = await adapter.requestDevice()
    const format = navigator.gpu.getPreferredCanvasFormat()
    const PARAMS = {
      patternAngle: 0,
      contrast: 1.35,
      bgColor: { r: 0.3, g: 0.3, b: 0.3, a: 1 },
      patternScale: 5,
      tintColor: { r: 1, g: 1, b: 1, a: 1 },
      patternMode: 6,
    }
    const photos = [exPhoto, ...exBg.querySelectorAll('.examples-alt')]
    const shades = [...exBg.querySelectorAll('.examples-shade')]
    await Promise.all(photos.map((img) => img.decode().catch(() => {})))
    const cv = Object.assign(document.createElement('canvas'), { className: 'examples-live' })
    cv.setAttribute('aria-hidden', 'true')
    shades[shades.length - 1].after(cv) // over the photos, under the cursor grid
    const ctx = cv.getContext('webgpu')
    ctx.configure({ device, format, alphaMode: 'premultiplied' })
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    let w = 0,
      inputs = [],
      frame = null
    // One input texture per row photo, cover-cropped to the photo's box, rebuilt when the box changes size
    const build = () => {
      const W = Math.round(exPhoto.offsetWidth * dpr),
        H = Math.round(exPhoto.offsetHeight * dpr)
      if (!W || !H || W === w) return !!frame
      w = W
      cv.width = W
      cv.height = H
      inputs.forEach((t) => t.destroy())
      inputs = photos.map((img) => {
        const src = Object.assign(document.createElement('canvas'), { width: W, height: H })
        const k = Math.max(W / img.naturalWidth, H / img.naturalHeight),
          dw = img.naturalWidth * k,
          dh = img.naturalHeight * k
        src.getContext('2d').drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh)
        const tex = device.createTexture({
          size: [W, H],
          format: 'rgba8unorm',
          usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
        })
        device.queue.copyExternalImageToTexture({ source: src }, { texture: tex, premultipliedAlpha: true }, [W, H])
        return tex
      })
      frame = {
        state: {},
        params: { ...PARAMS, patternScale: PARAMS.patternScale * dpr },
        input: inputs[0],
        output: null,
        time: 0,
        ripple: 1,
        box: null,
      }
      PatternScreen.setup(device, frame)
      return true
    }
    if (!build()) return
    // The ripple's source: the row of cards whose middle is nearest the middle of the screen, in canvas px
    const cards = [...exStage.querySelectorAll('.ex-card')]
    const rowBox = () => {
      const r = cv.getBoundingClientRect()
      if (!r.width) return null
      const rects = cards.map((c) => c.getBoundingClientRect())
      const near = rects.reduce((a, q) =>
        Math.abs(q.top + q.height / 2 - innerHeight / 2) < Math.abs(a.top + a.height / 2 - innerHeight / 2) ? q : a,
      )
      const row = rects.filter((q) => Math.abs(q.top - near.top) < 2)
      const L = Math.min(...row.map((q) => q.left)),
        R = Math.max(...row.map((q) => q.right)),
        T = near.top,
        B = Math.max(...row.map((q) => q.bottom))
      const k = cv.width / r.width
      return [
        ((L + R) / 2 - r.left) * k,
        ((T + B) / 2 - r.top) * k,
        ((R - L) / 2) * k,
        ((B - T) / 2) * k,
        16 * k,
        0,
        0,
        0,
      ]
    }
    let raf = 0,
      liveUntil = 0
    const tick = (ts) => {
      raf = 0
      const i = shades.findIndex((sh) => sh.classList.contains('is-on'))
      cv.classList.toggle('is-on', i >= 0)
      if (i >= 0) {
        frame.input = inputs[i]
        liveUntil = ts + 600
      }
      if (ts > liveUntil) return // faded out: stop drawing until the next scroll
      frame.time = ts / 1000
      frame.box = rowBox()
      frame.output = ctx.getCurrentTexture()
      PatternScreen.render(device, frame)
      raf = requestAnimationFrame(tick)
    }
    const wake = () => {
      if (!raf) raf = requestAnimationFrame(tick)
    }
    addEventListener('scroll', wake, { passive: true })
    new ResizeObserver(() => {
      if (build()) wake()
    }).observe(exPhoto)
    exBg.classList.add('has-live-shade')
  }
  setTimeout(
    () => applyExamplesShade().catch((err) => console.warn('Examples shader failed:', err)),
    reducedMotion ? 0 : 3600,
  )
}
