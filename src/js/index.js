import Search from './moduls/Search';
import Recipe from './moduls/Recipe';
import List from './moduls/List';
import Likes from './moduls/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import { elements, renderLoader, clearLoader } from './views/base';


const state = {};

/**
 * Kontroler wyszukiwania
 */

const controlSearch = async () => {
    // Biorę zapytanie z pliku View
    const query = searchView.getInput();

    if (query) {
        // nowy obiekt dodaję do stanu
        state.search = new Search(query);

        // przygotowuję interfejs
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);

        // szukam przepisu
        await state.search.getResults();

        // renderuję wynik w interfejsie
        clearLoader();
        searchView.renderResults(state.search.result);
    }
}

elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
});

elements.searchResPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline');
    if (btn) {
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
        console.log(goToPage);
    }
})

/**
 * Kontroler przepisu
 */

 const controlRecipe = async () => {
     // biorę ID z url
    const id = window.location.hash.replace('#', '');

    if (id) {
        // przygotowuję interfejs na zmiany
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        if (state.search) searchView.hightlightSelected(id);

        // tworzę nowy objekt z przepisem
        state.recipe = new Recipe(id);

        try {
            // poberam dane przepisu
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();

            // obliczam czas i ilość porcji
            state.recipe.calcTime();
            state.recipe.calcServings();

            // renderuję przepis
            clearLoader();
            recipeView.rednerRecipe(state.recipe, state.likes.isLiked(id));
        } catch (error) {
            alert('Błąd w pobieraniu przepisu')
        }
    }
 };

// window.addEventListener('hashchange', controlRecipe)
// window.addEventListener('load', controlRecipe);

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

/**
 * Kontroler Listy
 */

const controlList = () => {
    // Tworze nową listę jeżeli jeszcze nie ma
    if (!state.list) state.list = new List();

    // Dodaję każdy składnik do listy i interfejsu
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    });
}

elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    if (e.target.matches('.shopping__delete, .shopping__delete *')) {
        // kasuję ze stanu
        state.list.deleteItem(id);

        // kasuję z interfejsu
        listView.deleteItem(id);
    } else if (e.target.matches('.shopping__count-value')) {
        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val);
    }
});

/**
 * Kontroler polubień
 */


const controlLike = () => {
    if (!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;

    // użytkownik ma już ulubiony przepisu
    if (!state.likes.isLiked(currentID)) {
        // dodaję polubienie do stanu
        const newLike = state.likes.addLike(currentID, state.recipe.title, state.recipe.author, state.recipe.img);

        // przełączam button polubienia
        likesView.toggleLikeBtn(true);

        // dodaję polubienie do interfejsu
        likesView.renderLike(newLike);

    // użytkownik nie ma jeszcze ulubionego przepisu
    } else {
        // usuwam polubienie ze stanu
        state.likes.deleteLike(currentID);

        // przełączam button polubienia
        likesView.toggleLikeBtn(false);

        // usuwam polubienie z interfejsu
        likesView.deleteLike(currentID);

    }
    likesView.toggleLikeMenu(state.likes.getNumLikes());
};

window.addEventListener('load', () => {
    state.likes = new Likes();

    // przywracam lajki
    state.likes.readStorage();

    // toggluje przycisk lajków
    likesView.toggleLikeMenu(state.likes.getNumLikes());

    // renderuje istniejące lajki
    state.likes.likes.forEach(like => likesView.renderLike(like));
})

elements.recipe.addEventListener('click', e => {
    if (e.target.matches('.btn-decrease, .btn-decrease *')) {
        // buton 'dec' ma 'click'
        if (state.recipe.servings > 1) {
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngrediends(state.recipe);
        }
    } else if (e.target.matches('.btn-increase, .btn-increase *')) {
        // buton 'inc' ma 'click'
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngrediends(state.recipe);
    } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
        // dodaję składniki do listy zakupów
        controlList();
    } else if (e.target.matches('.recipe__love, .recipe__love *')) {
        // kontroler polubień
        controlLike();
    }
});

