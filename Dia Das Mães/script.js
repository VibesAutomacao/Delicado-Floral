document.addEventListener('DOMContentLoaded',function(){
  const yearEl = document.getElementById('year')
  if(yearEl) yearEl.textContent = new Date().getFullYear()

  const copyBtn = document.getElementById('copyKey')
  if(copyBtn){
    copyBtn.addEventListener('click',async function(){
      const key = document.getElementById('pixKey')
      if(!key) return
      try{
        await navigator.clipboard.writeText(key.value)
        copyBtn.textContent = 'Copiado!'
        setTimeout(()=>copyBtn.textContent='Copiar',1500)
      }catch(e){
        const range = document.createRange();
        range.selectNodeContents(key);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    })
  }

  // botão 'copiar valor' removido — não é necessário aqui

  const done = document.getElementById('done')
  if(done){
    done.addEventListener('click',function(){
      // montar email com mensagem padrão e dados do pedido (se houver)
      const to = 'ltdacomerce@gmail.com'
      const subject = 'Confirmação de pagamento - Delicado Floral'
      let body = 'Olá, realizei o pagamento da Oferta da Delicado Floral.\n\nPor favor, confirmar o recebimento e processar o pedido.\n\nAnexo o comprovante de pagamento.\n\n'
      try{
        const order = JSON.parse(localStorage.getItem('delicado_order') || 'null')
        if(order){
          body += `Dados do pedido:\nNome: ${order.name}\nTelefone: ${order.phone}\nEndereço: ${order.street}, ${order.number} ${order.complement || ''} - ${order.city}\nValor: ${order.amount}\nItens: ${order.items.join(', ')}\n\n` }
      }catch(e){}
      body += 'Obrigado.'
      const mailto = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      window.location.href = mailto
    })
  }

  // QR desbloqueio removido — QR exibido diretamente em pix.html
  
  // --- Checkout modal flow ---
  const buy = document.getElementById('buyButton')
  if(buy){
    buy.addEventListener('click',openCheckout)
  }

  function openCheckout(){
    // criar modal dinamicamente para compatibilidade
    if(document.querySelector('.modal-backdrop')) return showModal()
    const backdrop = document.createElement('div')
    backdrop.className = 'modal-backdrop show'
    backdrop.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal-grid">
          <div>
            <h3>Finalize seu pedido</h3>
            <p class="small">Insira seu CEP para buscar opções de endereço. Escolha a opção correta e preencha nome/telefone.</p>
            <div class="cep-row">
              <input id="cepInput" placeholder="CEP (somente números)" />
              <button id="cepSearch" class="btn">Buscar</button>
            </div>

            <div id="cepResult" class="small" style="margin-top:.5rem"></div>

            <div id="regionArea" style="margin-top:.6rem;display:none">
              <label class="small">Selecione a opção de endereço encontrada</label>
              <div id="regionList" class="region-list"></div>
            </div>

            <div style="margin-top:.6rem">
              <div class="form-row"><input id="fullName" placeholder="Nome completo" /></div>
              <div class="form-row"><input id="phone" placeholder="Telefone (WhatsApp)" /></div>
              <div class="form-row"><input id="street" placeholder="Logradouro" /></div>
              <div class="form-row"><input id="number" placeholder="Número" /></div>
              <div class="form-row"><input id="complement" placeholder="Complemento (opcional)" /></div>
              <div class="form-row"><input id="city" placeholder="Cidade" /></div>
            </div>

            <div class="checklist">
              <label class="small">Confirme os itens do combo</label>
              <label><input type="checkbox" checked disabled /> 1 Buquê de Rosas (8 unid.)</label>
              <label><input type="checkbox" checked disabled /> 1 Cesta de Perfumaria</label>
              <label><input type="checkbox" checked disabled /> 1 Pelúcia</label>
              <label><input type="checkbox" checked disabled /> 1 Cartão personalizado</label>
            </div>
          </div>
          <aside>
            <h4>Resumo</h4>
            <p class="small">Valor: <strong>R$ 49,90</strong></p>
            <div style="margin-top:1rem">
              <label class="small">Observações</label>
              <textarea id="notes" rows="6" placeholder="Deseja incluir mensagem no cartão?"></textarea>
            </div>
          </aside>
        </div>
        <div class="modal-actions">
          <div class="small">Ao confirmar, a página de pagamento por PIX será aberta em nova aba.</div>
          <div>
            <button id="cancelCheckout" class="btn btn-outline">Cancelar</button>
            <button id="confirmCheckout" class="btn btn-buy">Confirmar e Pagar</button>
          </div>
        </div>
      </div>`
    document.body.appendChild(backdrop)

    // attach events
    document.getElementById('cepSearch').addEventListener('click',onCepSearch)
    document.getElementById('cancelCheckout').addEventListener('click',closeModal)
    document.getElementById('confirmCheckout').addEventListener('click',confirmCheckout)

    // garantir visibilidade do botão em mobile quando o teclado aparecer
    const inputs = backdrop.querySelectorAll('input, textarea')
    inputs.forEach(inp=>{
      inp.addEventListener('focus',()=>{
        setTimeout(()=>{
          const modalActions = document.querySelector('.modal-actions')
          if(modalActions){ modalActions.scrollIntoView({behavior:'smooth',block:'end'}) }
        },300)
      })
    })

    function showModal(){
      const el = document.querySelector('.modal-backdrop')
      if(el) el.classList.add('show')
    }
    showModal()
  }

  function closeModal(){
    const el = document.querySelector('.modal-backdrop')
    if(el) el.remove()
  }

  async function onCepSearch(){
    const cep = (document.getElementById('cepInput').value || '').replace(/\D/g,'')
    const resultEl = document.getElementById('cepResult')
    const regionArea = document.getElementById('regionArea')
    const regionList = document.getElementById('regionList')
    regionArea.style.display = 'none'
    regionList.innerHTML = ''
    if(!cep || cep.length !== 8){ resultEl.textContent = 'CEP inválido. Digite 8 números.'; return }
    resultEl.textContent = 'Buscando...'
    try{
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await res.json()
      if(data.erro){ resultEl.textContent = 'CEP não encontrado.'; return }
      // Mostra uma lista com opção principal e variações: logradouro + bairro
      resultEl.textContent = `Endereço encontrado: ${data.logradouro || ''} ${data.bairro || ''} - ${data.localidade}/${data.uf}`
      const options = []
      options.push({label:`${data.logradouro || ''} - ${data.bairro || ''}`, value:JSON.stringify(data)})
      // se tiver outras informações, podemos adicionar variações; por enquanto só 1
      regionList.innerHTML = options.map((o,i)=>`<label style="display:block; padding:.4rem; border-bottom:1px solid #f5f5f5"><input type="radio" name="regionOpt" data-value='${o.value}' ${i===0? 'checked':''}/> ${o.label}</label>`).join('')
      regionArea.style.display = 'block'

      // preenche campos
      document.getElementById('street').value = data.logradouro || ''
      document.getElementById('city').value = (data.localidade || '') + ' - ' + (data.uf || '')
    }catch(e){ resultEl.textContent = 'Erro ao buscar CEP.' }
  }

  function confirmCheckout(){
    const name = document.getElementById('fullName').value.trim()
    const phone = document.getElementById('phone').value.trim()
    const street = document.getElementById('street').value.trim()
    const number = document.getElementById('number').value.trim()
    const complement = document.getElementById('complement').value.trim()
    const city = document.getElementById('city').value.trim()
    const notes = document.getElementById('notes').value.trim()

    if(!name || !phone || !street || !number){ alert('Por favor preencha Nome, Telefone, Logradouro e Número.'); return }

    const order = {
      name, phone, street, number, complement, city, notes,
      items:["Buquê de Rosas (8)","Cesta de Perfumaria","Pelúcia","Cartão personalizado"],
      amount:'R$ 49,90',
      created: new Date().toISOString()
    }
    // salvar para referência e para pix.html ler (se necessário)
    try{ localStorage.setItem('delicado_order', JSON.stringify(order)) }catch(e){}

    // abrir pix.html em nova aba
    window.open('pix.html','_blank')
    closeModal()
    alert('Pedido registrado localmente. Após efetuar o PIX, nos envie o comprovante por WhatsApp.')
  }
})
