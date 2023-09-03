/** @format */

import { Notify, Loading } from 'notiflix';
import 'bootstrap/dist/css/bootstrap.min.css';
import { fetchFilmsItems, apiKey } from './fetch_api.js';

const ref = {
	gallery: document.querySelector('.gallery'),
	searchForm: document.querySelector('#search-form'),
	btnLoadmore: document.querySelector('.load-more'),
	scrollbar: document.querySelector('.scrollbar'),
	modalWindow: document.querySelector('.modal_window'),
	searchBlock: document.querySelector('#block'),
};

const paramFetch = {
	searchItem: '',
	page: 1,
	countFoundItem: 0,
	totalPage: 0,
	include_adult: true,
};

ref.searchForm.addEventListener('submit', onSearchClickBtn);
ref.btnLoadmore.addEventListener('click', onClickLoadmore);
ref.modalWindow.addEventListener('click', onClose);
ref.gallery.addEventListener('click', createFullDescription);

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
				Notify.success(`Hooray! We found ${paramFetch.countFoundItem} films.`);
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
		});
}

function updatePage(res) {
	paramFetch.page += 1;
	if (paramFetch.totalPage < paramFetch.page) {
		ref.btnLoadmore.classList.add('is-hidden');
	} else {
		ref.searchBlock.classList.replace('search_block', 'search_block_run');
		ref.searchForm.classList.replace('search-form', 'search-form_run');
		ref.btnLoadmore.classList.remove('is-hidden');
	}
	ref.gallery.insertAdjacentHTML('beforeend', markupImg(res.results));
	createCardClickFunction();
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
			({
				poster_path,
				title,
				original_language,
				original_title,
				overview,
				release_date,
				vote_average,
			}) => {
				poster_path
					? (path = `https://image.tmdb.org/t/p/w500${poster_path}?api_key=${apiKey}`)
					: (path =
							'https://cojo.ru/wp-content/uploads/2022/12/neoklassika-kinomuzyka.-neorchestra-1.webp');
				return `<li class="film-card" data-original_language="${original_language}" data-original_title="${original_title}" data-overview="${overview}" data-release_date=${release_date} data-vote_average="${vote_average}">
					<div class="img">
						<img src="${path}" alt="${title}" loading="lazy" width="100%" />
					</div>                	
            		<div class="info">
						<p class="info-item">
						${title}
						</p>
						<p class="info-item">
						<span>Рейтинг зрителей</span>
						<span>${vote_average}</span>
						</p>
            	</div>             
        		</li>`;
			}
		)
		.join('');
}

function resetParamNewSearch() {
	ref.gallery.innerHTML = '';
	paramFetch.page = 1;
	paramFetch.countFoundItem = 0;
	ref.btnLoadmore.classList.add('is-hidden');
	ref.modalWindow.classList.add('is-hidden');
	ref.searchBlock.classList.replace('search_block_run', 'search_block');
	ref.searchForm.classList.replace('search-form_run', 'search-form');
}

function createCardClickFunction() {
	// const filmCards = document.querySelectorAll('.film-card');
	// for (const filmCard of filmCards) {
	// 	filmCard.addEventListener('click', createFullDescription);
	// }
}

function createFullDescription(e) {
	e.preventDefault();
	const { target, currentTarget } = e;
	if (!target.closest('li.film-card')) {
		return;
	}
	window.addEventListener('keydown', onClickEsc);
	const currentFilm = target.closest('li.film-card');
	ref.modalWindow.classList.remove('is-hidden');
	const { original_language, original_title, overview, release_date, vote_average } =
		currentFilm.dataset;
	const imgElement = currentFilm.querySelector('img');
	const srcValue = imgElement
		? imgElement.getAttribute('src')
		: 'https://cojo.ru/wp-content/uploads/2022/12/neoklassika-kinomuzyka.-neorchestra-1.webp';
	const modalContent = `<div class="window">
		<img src="${srcValue}" alt="${original_title}"/>
		<ul class="film_data">
				<li>
					Название в оригинале: <span class="film_tag">${original_title}</span>
					
				</li>
				<li>
					Язык оригинала: <span class="film_tag">${original_language}</span>
				</li>
				<li>
					Дата выпуска: <span class="film_tag">${release_date}</span>
					
				</li>
				<li>
					Рейтинг зрителей: <span class="film_tag">${vote_average}</span>
				</li>
				<li>
					Описание фильма: <span class="film_tag">${overview}</span>				
				</li>
		</ul>	
	</div>`;
	return (ref.modalWindow.innerHTML = modalContent);
}

function onClose(e) {
	if (e.target === e.currentTarget) {
		hiddenModal();
	}
}

function onClickEsc(e) {
	const ESCAPE = 'Escape';
	const keyClicked = e.code;

	if (keyClicked === ESCAPE) {
		hiddenModal();
	}
}

function hiddenModal() {
	ref.modalWindow.classList.add('is-hidden');
	window.removeEventListener('keydown', onClickEsc);
}
