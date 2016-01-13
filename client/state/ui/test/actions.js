/**
 * External dependencies
 */
import { expect } from 'chai';

/**
 * Internal dependencies
 */
import { SET_SELECTED_SITE, CURRENT_USER_ID_SET } from 'state/action-types';
import { setSelectedSite, setCurrentUserId } from '../actions';

describe( 'actions', () => {
	describe( '#setSelectedSite()', () => {
		it( 'should return an action object', () => {
			const action = setSelectedSite( 2916284 );

			expect( action ).to.eql( {
				type: SET_SELECTED_SITE,
				siteId: 2916284
			} );
		} );
	} );

	describe( '#setCurrentUserId()', () => {
		it( 'should return an action object', () => {
			const action = setCurrentUserId( 73705554 );

			expect( action ).to.eql( {
				type: CURRENT_USER_ID_SET,
				userId: 73705554
			} );
		} );
	} );
} );
