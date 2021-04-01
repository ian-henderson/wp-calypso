/**
 * External dependencies
 */
import config from 'config';

/**
 * Internal dependencies
 */
import * as driverManager from '../lib/driver-manager';
import * as dataHelper from '../lib/data-helper';
import LoginFlow from '../lib/flows/login-flow';
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
		step( 'Login and create a new post', async function () {
			this.loginFlow = new LoginFlow( driver, 'gutenbergSimpleSiteUser' );
			await this.loginFlow.loginAndStartNewPost( null, true );
			const gEditorComponent = await GutenbergEditorComponent.Expect( driver );
			await gEditorComponent.enterTitle( blogPostTitle );
			return await gEditorComponent.enterText( blogPostQuote );
		} );

		step( 'Publish and visit new post', async function () {
			const gEditorComponent = await GutenbergEditorComponent.Expect( driver );
			await gEditorComponent.publish( { visit: true } );
		} );

		// step( 'Like post', async function () {
		// 	const postArea = await PostAreaComponent.Expect( driver );
		// 	return await postArea._likePost();
		// } );

		step( 'Post a comment', async function () {
			const commentArea = await CommentsAreaComponent.Expect( driver );
			return await commentArea._postComment( {
				comment: dataHelper.randomPhrase(),
				name: 'e2eTestName',
				email: 'e2eTestName@test.com',
			} );
		} );

		// step( 'Like comment', async function () {
		// 	const commentArea = await CommentAreaComponent.Expect( driver );
		// 	return await commentArea._likecomment();
		// } );
	} );
} );
