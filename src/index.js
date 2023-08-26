/** @format */

import { Notify, Loading } from 'notiflix';
import 'bootstrap/dist/css/bootstrap.min.css';
var throttle = require('lodash.throttle');
import { fetchFilmsItems, apiKey } from './fetch_api.js';

const ref = {
	gallery: document.querySelector('.gallery'),
	searchForm: document.querySelector('.search-form'),
	btnLoadmore: document.querySelector('.load-more'),
	scrollbar: document.querySelector('.scrollbar'),
};

const paramFetch = {
	searchItem: '',
	page: 1,
	countFoundItem: 0,
	totalPage: 0,
};
const windowHeight = document.documentElement.clientHeight - 85;
let loadStatus = true;
let memScrollY = window.pageYOffset;

ref.searchForm.addEventListener('submit', onSearchClickBtn);
ref.btnLoadmore.addEventListener('click', onClickLoadmore);
window.addEventListener('scroll', throttle(onScrollLoadMore, 300));

function onSearchClickBtn(e) {
	e.preventDefault();

	resetParamNewSearch();

	paramFetch.searchItem = e.target.searchQuery.value;
	if (!paramFetch.searchItem) {
		Notify.warning('Search bar is empty.');
		return;
	}

	markupFetchSearchItem(paramFetch);

	e.target.searchQuery.value = '';
}

function markupFetchSearchItem() {
	Loading.dots();
	fetchFilmsItems(paramFetch)
		.then(res => {
			paramFetch.countFoundItem = res.total_results;
			paramFetch.totalPage = res.pages;

			if (paramFetch.countFoundItem) {
				Notify.success(`Hooray! We found ${paramFetch.countFoundItem} images.`);
				updatePage(res);
			} else {
				Notify.info('Nothing was found according to your request.');
			}
		})
		.catch(error => {
			Notify.failure('Unable to load results. ' + error.message);
		})
		.finally(() => {
			Loading.remove(250);
			loadStatus = false;
		});
}

function onClickLoadmore() {
	Loading.dots();
	fetchFilmsItems(paramFetch)
		.then(res => {
			if (paramFetch.totalPage <= paramFetch.page) {
				ref.btnLoadmore.classList.add('is-hidden');
				Notify.info("We're sorry, but you've reached the end of search results.");
			}
			updatePage(res);
			scrollWindow();
		})
		.catch(error => {
			Notify.failure('Unable to load results.');
		})
		.finally(() => {
			Loading.remove(350);
			loadStatus = false;
		});
}

function updatePage(res) {
	paramFetch.page += 1;
	if (paramFetch.totalPage < paramFetch.page) {
		ref.btnLoadmore.classList.add('is-hidden');
	} else {
		ref.btnLoadmore.classList.remove('is-hidden');
	}

	ref.gallery.insertAdjacentHTML('beforeend', markupImg(res.results));
}

function onScrollLoadMore() {
	const btnHeigth = !ref.radioBtn.checked ? 115 : 0;
	const galleryPosHeigth = ref.gallery.offsetHeight - 85;
	const currentScrollY = window.pageYOffset;
	const statusBar = (currentScrollY / (galleryPosHeigth - windowHeight + btnHeigth)) * 100;

	ref.scrollbar.style.width = `${statusBar}vw`;

	if (!ref.radioBtn.checked) {
		return;
	}

	const countPage = Math.ceil(paramFetch.countFoundItem / paramFetch.perPage);
	if (
		pageYOffset > galleryPosHeigth - windowHeight &&
		loadStatus === false &&
		memScrollY < currentScrollY &&
		countPage >= paramFetch.page
	) {
		memScrollY = window.pageYOffset;
		loadStatus = true;
		onClickLoadmore();
	}
}

function scrollWindow() {
	const { height: cardHeight } = ref.gallery.firstElementChild.getBoundingClientRect();
	window.scrollBy({
		top: cardHeight * 2,
		behavior: 'smooth',
	});
}

function markupImg(data) {
	return data
		.map(
			({ poster_path, vote_average, title }) =>
				`<li class="film-card">
                <img src="https://image.tmdb.org/t/p/w500${poster_path}?api_key=${apiKey}" alt="${title}" loading="lazy" width = "100%" />
            	<div class="info">
                <p class="info-item">
                ${title}
                </p>
                <p class="info-item">
                ${vote_average}
                </p>
            </div>             
        </li>`
		)
		.join('');
}

function resetParamNewSearch() {
	ref.gallery.innerHTML = '';
	paramFetch.page = 1;
	paramFetch.countFoundItem = 0;
	memScrollY = window.pageYOffset;
	ref.scrollbar.style.width = `0vw`;
	ref.btnLoadmore.classList.add('is-hidden');
}
