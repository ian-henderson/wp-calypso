/**
 * External dependencies
 */
import { By, until } from 'selenium-webdriver';

/**
 * Internal dependencies
 */
import * as driverHelper from '../../driver-helper';
import AsyncBaseContainer from '../../async-base-container';

export default class PostAreaComponent extends AsyncBaseContainer {
	constructor( driver ) {
		super( driver, By.css( 'article.post' ) );
	}

	async getPostHTML() {
		const postSelector = By.css( '.post .entry-content' );
		await driverHelper.waitTillPresentAndDisplayed( this.driver, postSelector );
		return await this.driver.findElement( postSelector ).getAttribute( 'innerHTML' );
	}

	async likePost() {
		const iFrame = By.css( 'iframe.post-likes-widget' );
		const likeButton = By.css( '.like.sd-button' );
		const postLikedText = By.xpath( `//span[@class='wpl-count-text'][.='You like this.']` );

		await this.driver.switchTo().defaultContent();
		await driverHelper.waitTillPresentAndDisplayed( this.driver, iFrame );
		await this.driver.wait(
			until.ableToSwitchToFrame( iFrame ),
			this.explicitWaitMS,
			'Could not switch to post like widget iFrame'
		);

		await driverHelper.scrollIntoView( this.driver, likeButton );
		await driverHelper.clickWhenClickable( this.driver, likeButton );
		await driverHelper.waitTillPresentAndDisplayed( this.driver, postLikedText );
		await this.driver.switchTo().defaultContent();
	}
}
