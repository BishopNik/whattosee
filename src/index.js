/** @format */

import { Notify, Loading } from 'notiflix';
import 'bootstrap/dist/css/bootstrap.min.css';
import { fetchFilmsItems, apiKey } from './fetch_api.js';
import { langInterface } from './lang.js';

const ref = {
	gallery: document.querySelector('.gallery'),
	searchForm: document.querySelector('#search-form'),
	btnLoadmore: document.querySelector('.load-more'),
	modalWindow: document.querySelector('.modal_window'),
	searchBlock: document.querySelector('#block'),
	langSelect: document.querySelector('#lang'),
	ageSelect: document.querySelector('#age'),
};

export const paramFetch = {
	searchItem: '',
	page: 1,
	countFoundItem: 0,
	totalPage: 0,
	include_adult: true,
	lang: 'ru-RU',
};

const messages = [
	{
		warning: 'Search bar is empty.',
		info: 'Nothing was found according to your request.',
		failure: 'Unable to load results. ',
		infoEnd: "We're sorry, but you've reached the end of search results.",
		success() {
			return `Hooray! We found ${paramFetch.countFoundItem} films.`;
		},
	},
	{
		warning: 'Поле поиска пусто.',
		info: 'По вашему запросу ничего не найдено.',
		failure: 'Не удалось загрузить результаты. ',
		infoEnd: 'Извините, но вы достигли конца результатов поиска.',
		success() {
			return `Ура! Мы нашли ${paramFetch.countFoundItem} фильмов.`;
		},
	},
	{
		warning: 'Pole wyszukiwania jest puste.',
		info: 'Nie znaleziono niczego zgodnego z Twoim zapytaniem.',
		failure: 'Nie można załadować wyników. ',
		infoEnd: 'Przepraszamy, ale osiągnąłeś koniec wyników wyszukiwania.',
		success() {
			return `Hurra! Znaleźliśmy ${paramFetch.countFoundItem} filmów.`;
		},
	},
];

let langIndex = 0;

ref.searchForm.addEventListener('submit', onSearchClickBtn);
ref.btnLoadmore.addEventListener('click', onClickLoadmore);
ref.modalWindow.addEventListener('click', onClose);
ref.gallery.addEventListener('click', createFullDescription);
ref.langSelect.addEventListener('change', onChange);

localizationPage(ref.langSelect.value);

function onSearchClickBtn(e) {
	e.preventDefault();

	resetParamNewSearch();

	const { warning } = messages[langIndex];

	paramFetch.lang = ref.langSelect.value;
	paramFetch.include_adult = ref.ageSelect.value;

	ref.searchForm.searchQuery.value
		? (paramFetch.searchItem = ref.searchForm.searchQuery.value)
		: null;
	if (!paramFetch.searchItem) {
		Notify.warning(warning);
		return;
	}

	markupFetchSearchItem(paramFetch);

	ref.searchForm.searchQuery.value = '';
}

function markupFetchSearchItem(paramFetch) {
	Loading.dots();

	fetchFilmsItems(paramFetch)
		.then(res => {
			paramFetch.countFoundItem = res.total_results;
			paramFetch.totalPage = res.total_pages;
			const { success, info } = messages[langIndex];
			const mes = success();

			if (paramFetch.countFoundItem) {
				Notify.success(mes);
				updatePage(res);
			} else {
				resetParamNewSearch();
				Notify.info(info);
			}
		})
		.catch(error => {
			const { failure } = messages[langIndex];
			Notify.failure(`${failure}${error.message}`);
		})
		.finally(() => {
			Loading.remove(250);
		});
}

function onClickLoadmore() {
	Loading.dots();
	const { infoEnd, failure } = messages[langIndex];
	fetchFilmsItems(paramFetch)
		.then(res => {
			if (paramFetch.totalPage <= paramFetch.page) {
				ref.btnLoadmore.classList.add('is-hidden');
				Notify.info(infoEnd);
			}
			updatePage(res);
			scrollWindow();
		})
		.catch(error => {
			Notify.failure(failure);
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
		ref.btnLoadmore.classList.remove('is-hidden');
	}
	ref.searchBlock.classList.replace('search_block', 'search_block_run');
	ref.searchForm.classList.replace('search-form', 'search-form_run');
	ref.gallery.insertAdjacentHTML('beforeend', markupImg(res.results));
}

function scrollWindow() {
	const { height: cardHeight } = ref.gallery.firstElementChild.getBoundingClientRect();
	window.scrollBy({
		top: cardHeight * 2,
		behavior: 'smooth',
	});
}

function markupImg(data) {
	const { rating } = langInterface[langIndex];
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
				const path = poster_path
					? `https://image.tmdb.org/t/p/w500${poster_path}?api_key=${apiKey}`
					: 'https://cojo.ru/wp-content/uploads/2022/12/neoklassika-kinomuzyka.-neorchestra-1.webp';
				return `<li class="film-card" data-original_language="${original_language}" data-original_title="${original_title}" data-overview="${overview}" data-release_date=${release_date} data-vote_average="${vote_average}">
					<div class="img">
						<img src="${path}" alt="${title}" loading="lazy" width="100%" />
					</div>                	
            		<div class="info">
						<p class="info-item">
						${title}
						</p>
						<p class="info-item">
						<span>${rating}</span>
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
	ref.btnLoadmore.classList.add('is-hidden');
	ref.modalWindow.classList.add('is-hidden');
	!paramFetch.totalPage
		? ref.searchBlock.classList.replace('search_block_run', 'search_block')
		: null;
	!paramFetch.totalPage
		? ref.searchForm.classList.replace('search-form_run', 'search-form')
		: null;
	paramFetch.page = 1;
	paramFetch.countFoundItem = 0;
	paramFetch.totalPage = 0;
}

function createFullDescription(e) {
	e.preventDefault();
	const { target } = e;
	const { titleFilms, originalLanguage, releaseDate, rating, overviewCount } =
		langInterface[langIndex];
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
					${titleFilms} <span class="film_tag">${original_title}</span>					
				</li>
				<li>
					${originalLanguage} <span class="film_tag">${original_language}</span>
				</li>
				<li>
					${releaseDate} <span class="film_tag">${release_date}</span>					
				</li>
				<li>
					${rating} <span class="film_tag">${vote_average}</span>
				</li>
				<li>
					${overviewCount} <span class="film_tag">${overview}</span>				
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

function onChange(e) {
	e.preventDefault();
	ref.gallery.innerHTML = '';
	paramFetch.page = 1;
	localizationPage(e.target.value);
	paramFetch.countFoundItem ? onSearchClickBtn(e) : null;
}

function localizationPage(lang) {
	paramFetch.lang = lang;
	switch (lang) {
		case 'en-US':
			langIndex = 0;
			break;
		case 'ru-RU':
			langIndex = 1;
			break;
		case 'pl-PL':
			langIndex = 2;
			break;
		default:
			langIndex = 0;
			break;
	}
	ref.searchForm.searchQuery.placeholder = langInterface[langIndex].inputPlaceholder;
	ref.searchForm.searchButton.textContent = langInterface[langIndex].buttonSearch;
	ref.btnLoadmore.textContent = langInterface[langIndex].buttonLoadmore;
	window.document.title = langInterface[langIndex].title;
}
