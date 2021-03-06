/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import { assert } from 'chai';
import { findIndex, some } from 'lodash';

/**
 * Internal dependencies
 */
import actions from './fixtures/actions';
import site from './fixtures/site';
import usersData from './fixtures/users';
import Dispatcher from 'calypso/dispatcher';
import UsersStore from 'calypso/lib/users/store';

describe( 'Users Store', () => {
	let siteId;
	let options;

	beforeEach( () => {
		siteId = site.ID;
		options = { siteId };
	} );

	test( 'Store should be an object', () => {
		assert.isObject( UsersStore );
	} );

	test( 'Store should have method emitChange', () => {
		assert.isFunction( UsersStore.emitChange );
	} );

	describe( 'Getting user by login', () => {
		test( 'Store should have method getUserByLogin', () => {
			assert.isFunction( UsersStore.getUserByLogin );
		} );

		test( 'Should return undefined when user not in store', () => {
			assert.isUndefined( UsersStore.getUserByLogin( siteId, usersData.users[ 0 ].login ) );
		} );

		test( 'Should return a user object when the user exists', () => {
			Dispatcher.handleServerAction( actions.fetched );
			const user = UsersStore.getUserByLogin( siteId, usersData.users[ 0 ].login );

			assert.isObject( user );
			assert.equal( user.ID, usersData.users[ 0 ].ID );
		} );
	} );

	describe( 'Fetch Users', () => {
		let users;

		beforeEach( () => {
			Dispatcher.handleServerAction( actions.fetched );
			users = UsersStore.getUsers( options );
		} );

		test( 'Should update the store on RECEIVE_USERS', () => {
			assert.isNotNull( users );
		} );

		test( 'The users store should return an array of objects when fetching users', () => {
			assert.isArray( users );
			assert.isObject( users[ 0 ] );
		} );

		test( 'A user object from the store should contain an array of roles', () => {
			assert.isArray( users[ 0 ].roles );
		} );

		test( 'Re-fetching a list of users when a users was deleted from the site should result in a smaller array', () => {
			Dispatcher.handleServerAction( actions.fetchAgainUserDeleted );
			const lessUsers = UsersStore.getUsers( options );
			assert.isBelow( lessUsers.length, users.length );
		} );

		test( 'Fetching more users should add to the array of objects', () => {
			Dispatcher.handleServerAction( actions.fetchMoreUsers );
			const moreUsers = UsersStore.getUsers( options );
			assert.isAbove( moreUsers.length, users.length );
		} );
	} );

	describe( 'Pagination', () => {
		let pagination;
		beforeEach( () => {
			Dispatcher.handleServerAction( actions.fetched );
			pagination = UsersStore.getPaginationData( options );
		} );

		test( 'has the correct total users', () => {
			assert.equal( pagination.totalUsers, 7 );
		} );

		test( 'has the correct offset', () => {
			assert.equal( pagination.usersCurrentOffset, 0 );
		} );

		test( 'fetches the correct number of users', () => {
			assert.equal( pagination.numUsersFetched, 5 );
		} );

		describe( 'after fetching more users', () => {
			beforeEach( () => {
				Dispatcher.handleServerAction( actions.fetchMoreUsers );
				pagination = UsersStore.getPaginationData( options );
			} );

			test( 'has the correct offset', () => {
				assert.equal( pagination.usersCurrentOffset, 5 );
			} );

			test( 'fetches the correct number of users', () => {
				assert.equal( pagination.numUsersFetched, 7 );
			} );
		} );
	} );

	describe( 'Polling updated users', () => {
		beforeEach( () => {
			Dispatcher.handleServerAction( actions.fetched );
			Dispatcher.handleServerAction( actions.fetchMoreUsers );
			Dispatcher.handleServerAction( actions.receiveUpdatedUsers );
		} );

		test( 'getUpdatedParams returns correct params', () => {
			const updatedParams = UsersStore.getUpdatedParams( options );
			assert.equal( updatedParams.offset, 0 );
			assert.equal( updatedParams.number, usersData.found );
		} );

		test( 'Polling updates expected users', () => {
			const updatedUsers = UsersStore.getUsers( options );
			assert.equal( updatedUsers.length, usersData.found );

			// The last two users should have a 'contributor' role
			updatedUsers.slice( -2, 2 ).forEach( ( user ) => {
				assert.equal( user.roles[ 0 ], 'contributor' );
			} );
		} );
	} );

	describe( 'Update a user', () => {
		beforeEach( () => {
			Dispatcher.handleServerAction( actions.fetched );
		} );

		test( 'Should update a specific user with new attributes', () => {
			const users = UsersStore.getUsers( options );
			const testUserIndex = findIndex( users, ( user ) => user.name === 'Test One' );
			Dispatcher.handleServerAction( actions.updateSingleUser );
			const usersAgain = UsersStore.getUsers( options );
			assert.equal( usersAgain[ testUserIndex ].name, 'Test Won' );
		} );

		test( 'Error should restore the updated user', () => {
			const userId = usersData.users[ 0 ].ID;
			const user = UsersStore.getUser( siteId, userId );

			assert.equal( user.name, 'Test One' );

			Dispatcher.handleServerAction( actions.updateSingleUser );
			const userAgain = UsersStore.getUser( siteId, userId );
			assert.equal( userAgain.name, 'Test Won' );

			Dispatcher.handleServerAction( actions.updateUserError );
			const userRestored = UsersStore.getUser( siteId, userId );
			assert.equal( userRestored.name, 'Test One' );
		} );
	} );

	describe( 'Delete a user', () => {
		let userId;
		let userAgain;

		beforeEach( () => {
			Dispatcher.handleServerAction( actions.fetched );
			userId = usersData.users[ 0 ].ID;
		} );

		test( 'Should delete a specific user', () => {
			Dispatcher.handleServerAction( actions.deleteUser );
			userAgain = UsersStore.getUser( siteId, userId );
			assert.equal( userAgain, null );
		} );

		test( 'Error should restore the deleted user', () => {
			Dispatcher.handleServerAction( actions.deleteUser );
			userAgain = UsersStore.getUser( siteId, userId );
			assert.equal( userAgain, null );

			Dispatcher.handleServerAction( actions.deleteUserError );
			const userRestored = UsersStore.getUser( siteId, userId );
			assert.equal( userRestored.name, 'Test One' );
		} );

		test( 'There should be no undefined objects in user array after deleting a user', () => {
			Dispatcher.handleServerAction( actions.deleteUser );
			const users = UsersStore.getUsers( options );
			const someUndefined = some( users, ( user ) => typeof user === 'undefined' );
			assert.isFalse( someUndefined );
		} );
	} );

	describe( 'Get single user', () => {
		beforeEach( () => {
			Dispatcher.handleServerAction( actions.fetched );
		} );
		test( 'Fetching a single user should add to the store', () => {
			const users = UsersStore.getUsers( options );
			assert.lengthOf( users, 5 );
			Dispatcher.handleServerAction( actions.receiveSingleUser );
			const usersAgain = UsersStore.getUsers( options );
			assert.lengthOf( usersAgain, 6 );
		} );
	} );
} );
