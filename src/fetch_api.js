/** @format */

import axios from 'axios';

const URL = 'https://api.themoviedb.org/3/search/movie';
const apiKey = '345007f9ab440e5b86cef51be6397df1';

async function fetchFilmsItems({
	page = 1,
	searchItem = '',
	include_adult = false,
	lang = 'ru-RU',
}) {
	const params = {
		api_key: apiKey,
		include_adult: include_adult,
		language: lang,
		page: page,
		query: searchItem,
	};
	const response = await axios.get(URL, { params });
	return response.data;
}

export { fetchFilmsItems, apiKey };
