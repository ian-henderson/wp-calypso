/**
 * External dependencies
 */
import config from 'config';
import { By } from 'selenium-webdriver';

/**
 * Internal dependencies
 */
import * as driverManager from '../lib/driver-manager';
import * as dataHelper from '../lib/data-helper';
import * as driverHelper from '../lib/driver-helper';
import LoginFlow from '../lib/flows/login-flow';
import PostAreaComponent from '../lib/pages/frontend/post-area-component';
import CommentsAreaComponent from '../lib/pages/frontend/comments-area-component';
import GutenbergEditorComponent from '../lib/gutenberg/gutenberg-editor-component';

const host = dataHelper.getJetpackHost();
const screenSize = driverManager.currentScreenSize();
const startBrowserTimeoutMS = config.get( 'startBrowserTimeoutMS' );
const mochaTimeoutMS = config.get( 'mochaTimeoutMS' );
const blogPostTitle = dataHelper.randomPhrase();
const blogPostQuote =
	'The foolish man seeks happiness in the distance. The wise grows it under his feet.\n— James Oppenheim';

describe( `[${ host }] Likes: (${ screenSize })`, function () {
	let driver;
	this.timeout( mochaTimeoutMS );

	before( 'Start browser', async function () {
		this.timeout( startBrowserTimeoutMS );
		driver = await driverManager.startBrowser();
	} );

	describe( 'Like posts and comments @parallel', function () {
		step( 'Login, create a new post and view it', async function () {
			this.loginFlow = new LoginFlow( driver, 'gutenbergSimpleSiteUser' );
			await this.loginFlow.loginAndStartNewPost( null, true );

			const gEditorComponent = await GutenbergEditorComponent.Expect( driver );
			await gEditorComponent.enterTitle( blogPostTitle );
			await gEditorComponent.enterText( blogPostQuote );
			await gEditorComponent.publish( { visit: true } );
		} );

		step( 'Like post', async function () {
			await PostAreaComponent.Expect( driver );

			const iFrame = By.css( 'iframe.post-likes-widget' );
			const likeButton = By.css( '.like.sd-button' );
			const postLikedText = By.xpath( `//span[@class='wpl-count-text'][.='You like this.']` );

			await driver.switchTo().defaultContent();
			await driverHelper.waitTillPresentAndDisplayed( driver, iFrame );
			await driverHelper.waitTillAbleToSwitchToFrame( driver, iFrame );
			await driverHelper.scrollIntoView( driver, likeButton );
			await driverHelper.clickWhenClickable( driver, likeButton );
			await driverHelper.waitTillPresentAndDisplayed( driver, postLikedText );
			await driver.switchTo().defaultContent();
		} );

		step( 'Post and like comment', async function () {
			const commentArea = await CommentsAreaComponent.Expect( driver );

			const comment = dataHelper.randomPhrase();

			await commentArea._postComment( {
				comment: comment,
				name: 'e2eTestName',
				email: 'e2eTestName@test.com',
			} );

			const commentLikeLink = By.xpath(
				`//div[@class='comment-content']/p[.='${ comment }']/../p/a[@class='comment-like-link']`
			);
			const commentLikedText = By.xpath(
				`//div[@class='comment-content']/p[.='${ comment }']/../p/span[starts-with(text(),'Liked by')]`
			);

			await this.driver.switchTo().defaultContent();
			await driverHelper.scrollIntoView( this.driver, commentLikeLink, 'end' );
			await driverHelper.clickWhenClickable( this.driver, commentLikeLink );
			await driverHelper.waitTillPresentAndDisplayed( this.driver, commentLikedText );
		} );
	} );
} );
