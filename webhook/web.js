class ImageInput {
  constructor({ className, label, url = null } = {}) {
    this.elem = Elem('button', {
      className: [className, 'image'],
      title: label,
      style: {
        backgroundImage: url ? `url("${encodeURI(url)}")` : null
      },
      onclick: e => {
        const url = prompt('URL da imagem (deixe em branco para limpar a imagem):', this.url)
        if (url !== null) {
          if (url) {
            this.elem.style.backgroundImage = `url("${encodeURI(url)}")`
            this.url = url
          } else {
            this.elem.style.backgroundImage = null
            this.url = null
          }
        }
        if (window.onChange) window.onChange()
      }
    })
    this.url = url
  }

  toJSON() {
    return this.url
  }
}

class TextInput {
  constructor({ className, value = '', placeholder, multiline = true } = {}) {
    let willCalculate = true
    if (multiline) {
      this.elem = Elem('textarea', {
        className,
        value,
        placeholder,
        cols: 1,
        oninput: e => {
          this.elem.style.height = 0
          if (!willCalculate) {
            willCalculate = true
            window.requestAnimationFrame(() => {
              this.elem.style.height = (this.elem.scrollHeight + 1) + 'px'
              willCalculate = false
            })
          }
        },
        onchange: e => {
          if (window.onChange) window.onChange()
        }
      })
      window.requestAnimationFrame(() => {
        this.elem.style.height = (this.elem.scrollHeight + 1) + 'px'
        willCalculate = false
      })
    } else {
      this.elem = Elem('input', {
        className,
        type: 'text',
        value,
        placeholder,
        oninput: e => {
          this.elem.style.width = 0
          if (!willCalculate) {
            willCalculate = true
            window.requestAnimationFrame(() => {
              this.elem.style.width = (this.elem.value ? this.elem.scrollWidth + 1 : 100) + 'px'
              willCalculate = false
            })
          }
        },
        onchange: e => {
          if (window.onChange) window.onChange()
        }
      })
      window.requestAnimationFrame(() => {
        this.elem.style.width = (this.elem.value ? this.elem.scrollWidth + 1 : 100) + 'px'
        willCalculate = false
      })
    }
  }

  get value() {
    return this.elem.value
  }

  toJSON() {
    return this.value
  }
}

class LinkInput {
  constructor({ className, label, url = null } = {}) {
    this.elem = Elem('a', {
      className: [className, 'link'],
      title: label,
      href: url || '#',
      onclick: e => {
        const url = prompt('URL da imagem (deixe em branco para limpar a imagem):', this.url)
        if (url !== null) {
          if (url) {
            this.elem.href = url
            this.url = url
          } else {
            this.elem.href = '#'
            this.url = null
          }
        }
        if (window.onChange) window.onChange()
        e.preventDefault()
      }
    })
    this.url = url
  }

  toJSON() {
    return this.url
  }
}

class Field {
  constructor({ name, value, inline = true } = {}, removeFn) {
    this._name = new TextInput({ className: 'embed-field-name', value: name, placeholder: 'Nome do campo' })
    this._value = new TextInput({ className: 'embed-field-value', value, placeholder: 'Valor do campo' })
    this._inline = inline

    this.elem = Elem('div', { className: ['embed-field', inline && 'embed-field-inline'] }, [
      this._name.elem,
      this._value.elem,
      Elem('button', {
        className: 'field-remove',
        title: 'Remove field',
        innerHTML: '&times;',
        onclick: e => {
          removeFn(this)
        }
      }),
      Elem('button', {
        className: 'field-inline',
        title: 'Toggle inline field',
        onclick: e => {
          this._inline = !this._inline
          this.elem.classList.toggle('embed-field-inline')
          if (window.onChange) window.onChange()
        }
      }, ['inline?'])
    ])
  }

  toJSON() {
    return {
      name: this._name,
      value: this._value,
      inline: this._inline
    }
  }
}

class Embed {
  constructor({
    title,
    description,
    link,
    timestamp,
    colour,
    footer,
    footerImage,
    image,
    thumbnail,
    author,
    authorLink,
    authorImage,
    fields = []
  } = {}, removeFn = null) {
    this.removeField = this.removeField.bind(this)

    this._authorImage = new ImageInput({ className: 'embed-author-icon', url: authorImage, label: 'Adicionar URL do icone do autor' })
    this._author = new TextInput({ className: 'embed-author-name', value: author, placeholder: 'Nome do autor' })
    this._authorLink = new LinkInput({ className: 'embed-author-link', url: authorLink, label: 'Adicionar URL do autor' })

    this._title = new TextInput({ className: 'embed-title', value: title, placeholder: 'Titulo da embed' })
    this._link = new LinkInput({ className: 'embed-link', url: link, label: 'Adicionar URL da embed' })
    this._description = new TextInput({ className: 'embed-description', value: description, placeholder: 'Descrição da embed (suporta markdown e links)' })
    this._thumbnail = new ImageInput({ className: 'embed-thumbnail', url: thumbnail, label: 'Adicionar URL da thumbnail' })
    this._image = new ImageInput({ className: 'embed-image', url: image, label: 'Adicionar URL da imagem' })

    this._footerImage = new ImageInput({ className: 'embed-footer-icon', url: footerImage, label: 'Adicionar URL do icone do rodapé' })
    this._footer = new TextInput({ className: 'embed-footer-text', value: footer, placeholder: 'Texto de rodapé', multiline: false })

    this._fields = fields.map(field => new Field(field, this.removeField))
    this._addFieldBtn = Elem('button', {
      className: 'add-field-btn add-btn',
      onclick: e => {
        const field = new Field({}, this.removeField)
        this._fields.push(field)
        this._addFieldBtn.parentElement.insertBefore(field.elem, this._addFieldBtn)
        if (window.onChange) window.onChange()
      }
    }, ['Add campo'])

    const timeStampTrigger = Elem('button', { title: 'Adicionar data' })
    this._timestamp = flatpickr(
      timeStampTrigger,
      {
        enableTime: true,
        onChange: ([date]) => {
          timeStampTrigger.textContent = date ? date.toLocaleString() : 'Unset'
          if (window.onChange) window.onChange()
        }
      }
    )
    if (timestamp) {
      this._timestamp.setDate(timestamp, true)
    } else {
      timeStampTrigger.textContent = 'Data'
    }

    const initColourStr = colour ? '#' + colour.toString(16).padStart(6, '0') : null
    const colourTrigger = Elem('button', {
      className: 'embed-pill',
      title: 'Adiconar cor',
      style: {
        backgroundColor: initColourStr
      }
    })
    this._colourValue = colour
    this._colour = new Pickr({
      el: colourTrigger,
      theme: 'monolith',
      useAsButton: true,
      default: initColourStr || '#7289DA',
      position: 'right-middle',
      components: {
        preview: true,
        hue: true,
        interaction: {
          input: true,
          clear: true
        },
      }
    })
      .on('change', colour => {
        colourTrigger.style.backgroundColor = colour.toRGBA()
      })
      .on('changestop', () => {
        this._colourValue = parseInt(this._colour.getColor().toHEXA().toString().slice(1), 16)
        if (window.onChange) window.onChange()
      })
      .on('clear', () => {
        colourTrigger.style.backgroundColor = null
        this._colourValue = null
      })

    this.elem = Elem('div', { className: 'embed' }, [
      Elem('button', {
        className: 'close',
        title: 'Remove embed',
        innerHTML: `<svg width="16" height="16" viewBox="0 0 12 12"><path class="fill" fill="currentColor" d="M9.5 3.205L8.795 2.5 6 5.295 3.205 2.5l-.705.705L5.295 6 2.5 8.795l.705.705L6 6.705 8.795 9.5l.705-.705L6.705 6"></path></svg>`,
        onclick: e => {
          if (removeFn) {
            removeFn(this)
          }
        }
      }),
      colourTrigger,
      Elem('div', { className: 'embed-inner' }, [
        Elem('div', { className: 'embed-content' }, [
          Elem('div', { className: 'embed-content-inner' }, [
            Elem('div', { className: 'embed-author' }, [
              this._authorImage.elem,
              this._author.elem,
              this._authorLink.elem
            ]),
            Elem('div', { className: 'embed-margin' }, [
              this._title.elem,
              this._link.elem
            ]),
            this._description.elem,
            Elem('div', { className: 'embed-fields embed-margin' }, [
              ...this._fields.map(({ elem }) => elem),
              this._addFieldBtn
            ])
          ]),
          this._thumbnail.elem
        ]),
        this._image.elem,
        Elem('div', { className: 'embed-footer embed-margin' }, [
          this._footerImage.elem,
          Elem('span', { className: 'embed-footer-text' }, [
            this._footer.elem,
            Elem('span', { className: 'embed-footer-separator', innerHTML: '&bull;' }),
            timeStampTrigger,
            ' ',
            Elem('button', {
              title: 'Limpar data',
              innerHTML: '&times;',
              onclick: e => {
                this._timestamp.clear()
              }
            })
          ])
        ])
      ])
    ])
  }

  removeField(field) {
    const index = this._fields.indexOf(field)
    if (~index) {
      this._fields.splice(index, 1)
    }
    this._addFieldBtn.parentElement.removeChild(field.elem)
    if (window.onChange) window.onChange()
  }

  remove() {
    this._timestamp.destroy()
    this._colour.destroyAndRemove()
  }

  toJSON() {
    return {
      title: this._title,
      description: this._description,
      url: this._link,
      timestamp: this._timestamp.selectedDates[0] ? this._timestamp.selectedDates[0].toISOString() : null,
      color: this._colourValue,
      footer: {
        text: this._footer,
        icon_url: this._footerImage
      },
      image: {
        url: this._image
      },
      thumbnail: {
        url: this._thumbnail
      },
      author: {
        name: this._author,
        url: this._authorLink,
        icon_url: this._authorImage
      },
      fields: this._fields
    }
  }

  static fromJSON({
    title,
    description,
    url: link,
    timestamp,
    color: colour,
    footer: { text: footer, icon_url: footerImage } = {},
    image: { url: image } = {},
    thumbnail: { url: thumbnail } = {},
    author: { name: author, url: authorLink, icon_url: authorImage },
    fields
  } = {}, removeFn) {
    return new Embed({
      title,
      description,
      link,
      timestamp,
      colour,
      footer,
      footerImage,
      image,
      thumbnail,
      author,
      authorLink,
      authorImage,
      fields
    }, removeFn)
  }
}

const params = new URL(window.location).searchParams
let json
try {
  json = JSON.parse(params.get('json'))
  if (json === null || typeof json !== 'object') throw json
} catch (e) {
  json = {}
}
const {
  content,
  username: usernameText,
  avatar_url,
  tts,
  embeds: embedsArray = []
} = json

const avatar = new ImageInput({ className: 'avatar image', url: avatar_url, label: 'Adicionar URL do avatar' })
const username = new TextInput({ className: 'username', value: usernameText, placeholder: 'Username', multiline: false })
const message = new TextInput({ className: 'markup', value: content, placeholder: 'Conteudo da Mensagem (Suporta markdown; Máximo 2000 caracteres)' })

function removeEmbed(embed) {
  const index = embeds.indexOf(embed)
  if (~index) {
    embeds.splice(index, 1)
  }
  addEmbedBtn.parentElement.removeChild(embed.elem)
  embed.remove()
  if (window.onChange) window.onChange()
}
const embeds = embedsArray.map(embed => Embed.fromJSON(embed, removeEmbed))
const addEmbedBtn = Elem('button', {
  className: 'add-embed-btn add-btn',
  onclick: e => {
    const embed = new Embed({}, removeEmbed)
    embeds.push(embed)
    addEmbedBtn.parentElement.insertBefore(embed.elem, addEmbedBtn)
    if (window.onChange) window.onchange()
  }
}, ['Adicionar EMBED'])

document.body.appendChild(
  Elem('div', { className: 'message' }, [
    Elem('div', { className: 'header' }, [
      avatar.elem,
      Elem('div', {}, [
        username.elem,
        Elem('span', { className: 'bot' }, ['BOT']),
        Elem('span', { className: 'timestamp' }, ['Hoje às 15:60'])
      ])
    ]),
    Elem('div', { className: 'content' }, [
      message.elem,
      Elem('div', { className: 'embeds' }, [
        ...embeds.map(({ elem }) => elem),
        addEmbedBtn
      ])
    ])
  ])
)

function getJSON() {
  return {
    content: message,
    username,
    avatar_url: avatar,
    tts: false,
    embeds
  }
}

const permalink = Elem('a', {
  className: 'permalink',
  title: 'obter link permanente',
  href: ''
})
window.onChange = () => {
  console.log('change')
  params.set('json', JSON.stringify(getJSON()))
  permalink.href = '?' + params
}
const status = Elem('div', { className: 'markup status hidden' })
let hideStatusTimeout
function displayStatus() {
  if (hideStatusTimeout) clearTimeout(hideStatusTimeout)
  status.classList.remove('hidden')
  hideStatusTimeout = setTimeout(() => {
    status.classList.add('hidden')
  }, 3000)
}
async function sendToWebhooks(webhookUrls, msgJson) {
  status.classList.remove('failed')
  let count = 0
  for (const url of webhookUrls) {
    count++
    const json = await fetch(url + '?wait=true', {
      method: 'POST',
      body: msgJson,
      headers: { 'Content-Type': 'application/json' }
    })
      .then(r => r.ok ? r.json() : r.json().then(err => Promise.reject(err)))
    status.textContent = 'Webhook enviado!' +
      (webhookUrls.length > 1 ? ` (${count}/${webhookUrls.length})` : '')
    displayStatus()
  }
}
document.body.appendChild(
  Elem('div', { className: 'channel-textarea' }, [
    status,
    Elem('div', { className: 'inner' }, [
      permalink,
      Elem('input', {
        className: 'textarea',
        type: 'url',
        value: params.get('webhook'),
        placeholder: 'Cole a URL do webhook aqui (Pressione enter para enviar)',
        onkeydown(e) {
          if (e.key === 'Enter') {
            // Send to multiple webhook URLs at once by separating them with
            // spaces
            sendToWebhooks(this.value.split(/\s+/), JSON.stringify(getJSON()))
              .catch(err => {
                console.error(err)
                status.textContent = 'Problem executing webhook'
                status.classList.add('failed')
                displayStatus()
              })
          }
        },
        onchange(e) {
          params.set('webhook', this.value)
          permalink.href = '?' + params
        }
      })
    ])
  ])
)