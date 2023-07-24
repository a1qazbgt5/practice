let indexURL = "https://user-list.alphacamp.io/api/v1/users"
let nav = document.querySelector(".navbar")
let buttonGroup = document.querySelector(".button-container")
let row = document.querySelector(".row")
let pagination = document.querySelector(".pagination")
let [numPerPage, page, lastPage] = [12, 1]
let [allUsers, favoriteUsers, users] = [[], [], []]
let displayFavorite = false

axios.get(indexURL)
  .then((response) => {
    users = allUsers = response.data.results
    renderPage(page = 1)
  })
  .catch(function (error) {
    console.log(error);
  });

function renderPage(page) {

  // render card-container
  let pageUsers = users.slice((page - 1) * numPerPage, page * numPerPage)
  row.innerHTML = pageUsers.reduce((rowHTML, user) => {
    let heartState = favoriteUsers.some((favoriteUser) => favoriteUser.id === user.id) ?
      'fa-solid' : 'fa-regular' // 逐一檢查是否有在最愛清單
    return rowHTML + `
        <div class="card btn m-2" data-bs-toggle="modal" data-bs-target="#info" style="width: 10rem; position: relative;" data-user-id="${user.id}">
          <i class="${heartState} fa-heart fa-xl" style="position: absolute; top: 20px; right: 10px; color: #4d73bb;" data-user-id="${user.id}"></i>
          <img class="card-img-top" src="${user.avatar}" alt="Card image cap" data-user-id="${user.id}">
          <h5 class="card-title text-center m-2" data-user-id="${user.id}">${user.name}</h5>
        </div>`;
  }, '');

  // render pagination
  if (!(lastPage = Math.ceil(users.length / numPerPage))) {
    pagination.innerHTML = '<h4>No matching result was found.</h4>'
    return
  }
  let [paginationListHTML, ellipsisFlag] = ['', false] // ellipsisFlag 用來記錄頁數是否開始要被省略
  for (let i = 1; i <= lastPage; i++) {
    if ((i === 1) || (i === lastPage) || ((i > page - 3) && (i < page + 3))) { // 必須顯示的頁數
      paginationListHTML += ((i === page) ? ` 
        <li class="page-item active" aria-current="page">
          <a class="page-link" data-page-id="${i}">${i}</a>
        </li>`
        : `
        <li class="page-item">
          <a class="page-link" data-page-id="${i}">${i}</a>
        </li>`)
      ellipsisFlag = false
    } else if (!ellipsisFlag) { // 開始要被省略的頁數。無效按鈕的 data-page-id 設定為 0
      paginationListHTML += `<li class="page-item"><a class="page-link" data-page-id="0">...</a></li>`
      ellipsisFlag = true // 下一頁若非必須顯示的頁數，則連 '...' 都不用了
    }
  }
  pagination.innerHTML = `
    <li class="page-item">
      <a class="page-link" data-page-id="${page - 1}">Previous</a>
    </li>` +
    paginationListHTML + `
    <li class="page-item">
      <a class="page-link" data-page-id="${page === lastPage ? 0 : page + 1}">Next</a>
    </li>` // 若是最後一頁，就沒有下一頁了。無效按鈕設定為 0
}

// 搜尋
nav.addEventListener("input", function onInputNav(event) {
  let keyword = event.target.value.toLowerCase()
  if (keyword.length) {
    users = (displayFavorite ? favoriteUsers : allUsers).filter((user) => user.name.toLowerCase().includes(keyword)) // 全域變數即時更新
    renderPage(page = 1) // 畫面即時更新
  } else {
    users = displayFavorite ? favoriteUsers : allUsers // 搜尋完還回正確的範圍
    renderPage(page = 1)
  }
})
nav.addEventListener('click', function onClickNav(event) {
  event.preventDefault()
  if (event.target.matches('.clear')) {
    document.querySelector('.keyword').value = ''
    users = displayFavorite ? favoriteUsers : allUsers // 搜尋完還回正確的範圍
    renderPage(page = 1)
  }
})

// 切換 All / Favorite 分頁
buttonGroup.addEventListener('click', function onClickButtonGroup(event) {
  if (event.target.matches('.Favorite')) // 全域變數即時更新，記錄下現在是哪個分頁避免搜尋結束後跑掉
    [users, displayFavorite] = [favoriteUsers, true]
  else[users, displayFavorite] = [allUsers, false]
  document.querySelector('.keyword').value = '' // 更新 users 會導致搜尋被取消
  renderPage(page = 1)
})

// 加最愛、開 Modal
row.addEventListener("click", function onClickRow(event) {
  let target = event.target
  let targetId = Number(target.dataset.userId)
  if (target.matches('.fa-heart')) {
    // target.classList.toggle('fa-regular')
    // target.classList.toggle('fa-solid')
    favoriteUsers.find((user) => user.id === targetId) ? // 是否已在最愛清單中
      favoriteUsers = favoriteUsers.filter((user) => user.id !== targetId)
      : favoriteUsers.unshift(allUsers.find((user) => user.id === targetId))
    localStorage.setItem('favoriteUsers', JSON.stringify(favoriteUsers))
    if (displayFavorite) {
      users = favoriteUsers // 為使移除最愛時即時更新頁面，但此舉造成搜尋被取消
      document.querySelector('.keyword').value = '' // 為與上述行為一致 
    }
    renderPage(page)
  }
  targetId && axios.get(`${indexURL}/${targetId}`) // render modal
    .then((response) => {
      let user = response.data
      document.querySelector(".modal-title").innerText = user.name
      document.querySelector(".modal-avatar").innerHTML = `
        <img src=${user.avatar} style="max-width:100%"></img>`;
      document.querySelector(".modal-text").innerHTML = `
        <ul>
          <li>Email: ${user.email}</li>
          <li>Gender: ${user.gender}</li>
          <li>Age: ${user.age}</li>
          <li>Region: ${user.region}</li>
          <li>Birthday: ${user.birthday}</li>
        </ul>`
    })
})

// 換頁
pagination.addEventListener('click', function onClickPagination(event) {
  let clickPage = Number(event.target.dataset.pageId) // 無效按鈕設定為 0 (參見 renderPage)
  if (clickPage && clickPage !== page)
    renderPage(page = clickPage)
})