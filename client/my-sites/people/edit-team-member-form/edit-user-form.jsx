/**
 * External dependencies
 */
import React, { Fragment } from 'react';
import { localize } from 'i18n-calypso';
import debugModule from 'debug';
import { connect, useDispatch } from 'react-redux';

/**
 * Internal dependencies
 */
import ContractorSelect from 'calypso/my-sites/people/contractor-select';
import FormLabel from 'calypso/components/forms/form-label';
import FormFieldset from 'calypso/components/forms/form-fieldset';
import FormTextInput from 'calypso/components/forms/form-text-input';
import FormButton from 'calypso/components/forms/form-button';
import FormButtonsBar from 'calypso/components/forms/form-buttons-bar';
import isVipSite from 'calypso/state/selectors/is-vip-site';
import RoleSelect from 'calypso/my-sites/people/role-select';
import { getCurrentUser } from 'calypso/state/current-user/selectors';
import { recordGoogleEvent } from 'calypso/state/analytics/actions';
import {
	requestExternalContributors,
	requestExternalContributorsAddition,
	requestExternalContributorsRemoval,
} from 'calypso/state/data-getters';
import isSiteWPForTeams from 'calypso/state/selectors/is-site-wpforteams';
import useUpdateUserMutation from 'calypso/data/users/use-update-user-mutation';
import { errorNotice, successNotice } from 'calypso/state/notices/actions';

/**
 * Style dependencies
 */
import './style.scss';

/**
 * Module Variables
 */
const debug = debugModule( 'calypso:my-sites:people:edit-team-member-form' );

class EditUserForm extends React.Component {
	state = this.getStateObject( this.props );

	componentDidUpdate() {
		if ( ! this.hasUnsavedSettings() ) {
			this.props.markSaved();
		}
	}

	getStateObject( { user, isExternalContributor } ) {
		const { first_name, last_name, name, roles } = user;

		return {
			first_name,
			last_name,
			name,
			roles: roles?.[ 0 ],
			isExternalContributor,
		};
	}

	getChangedSettings() {
		const originalSettings = this.getStateObject( this.props );
		const allowedSettings = this.getAllowedSettingsToChange();
		const changedKeys = allowedSettings.filter( ( setting ) => {
			return (
				'undefined' !== typeof originalSettings[ setting ] &&
				'undefined' !== typeof this.state[ setting ] &&
				originalSettings[ setting ] !== this.state[ setting ]
			);
		} );
		const changedSettings = changedKeys.reduce( ( acc, key ) => {
			acc[ key ] = this.state[ key ];
			return acc;
		}, {} );

		return changedSettings;
	}

	getAllowedSettingsToChange() {
		const { currentUser, user, isJetpack } = this.props;
		const allowedSettings = [];

		if ( ! user?.ID ) {
			return allowedSettings;
		}

		// On WP.com sites, a user should only be able to update role.
		// A user should not be able to update own role.
		if ( isJetpack ) {
			if ( ! user.linked_user_ID || user.linked_user_ID !== currentUser.ID ) {
				allowedSettings.push( 'roles', 'isExternalContributor' );
			}
			allowedSettings.push( 'first_name', 'last_name', 'name' );
		} else if ( user.ID !== currentUser.ID ) {
			allowedSettings.push( 'roles', 'isExternalContributor' );
		}

		return allowedSettings;
	}

	hasUnsavedSettings() {
		return Object.keys( this.getChangedSettings() ).length;
	}

	updateUser = ( event ) => {
		event.preventDefault();

		const { siteId, user, markSaved } = this.props;
		const changedSettings = this.getChangedSettings();
		debug( 'Changed settings: ' + JSON.stringify( changedSettings ) );

		markSaved();

		// Since we store 'roles' in state as a string, but user objects expect
		// roles to be an array, if we've updated the user's role, we need to
		// place the role in an array before updating the user.
		const changedAttributes = changedSettings.roles
			? Object.assign( changedSettings, { roles: [ changedSettings.roles ] } )
			: changedSettings;

		this.props.updateUser( this.state.ID, changedAttributes );

		if ( true === changedSettings.isExternalContributor ) {
			requestExternalContributorsAddition(
				siteId,
				undefined !== user.linked_user_ID ? user.linked_user_ID : user.ID
			);
		} else if ( false === changedSettings.isExternalContributor ) {
			requestExternalContributorsRemoval(
				siteId,
				undefined !== user.linked_user_ID ? user.linked_user_ID : user.ID
			);
		}

		this.props.recordGoogleEvent( 'People', 'Clicked Save Changes Button on User Edit' );
	};

	recordFieldFocus = ( fieldId ) => () =>
		this.props.recordGoogleEvent( 'People', 'Focused on field on User Edit', 'Field', fieldId );

	handleChange = ( event ) => {
		const stateChange = { [ event.target.name ]: event.target.value };
		this.setState( stateChange );
	};

	handleExternalChange = ( event ) =>
		this.setState( { isExternalContributor: event.target.checked } );

	isExternalRole = ( role ) =>
		[ 'administrator', 'editor', 'author', 'contributor' ].includes( role );

	renderField = ( fieldId ) => {
		let returnField = null;
		switch ( fieldId ) {
			case 'roles':
				returnField = (
					<Fragment key="roles">
						<RoleSelect
							id="roles"
							name="roles"
							siteId={ this.props.siteId }
							value={ this.state.roles }
							onChange={ this.handleChange }
							onFocus={ this.recordFieldFocus( 'roles' ) }
						/>
						{ ! this.props.isVip &&
							! this.props.isWPForTeamsSite &&
							this.isExternalRole( this.state.roles ) && (
								<ContractorSelect
									onChange={ this.handleExternalChange }
									checked={ this.state.isExternalContributor }
								/>
							) }
					</Fragment>
				);
				break;
			case 'first_name':
				returnField = (
					<FormFieldset key="first_name">
						<FormLabel htmlFor="first_name">
							{ this.props.translate( 'First Name', {
								context: 'Text that is displayed in a label of a form.',
							} ) }
						</FormLabel>
						<FormTextInput
							id="first_name"
							name="first_name"
							value={ this.state.first_name }
							onChange={ this.handleChange }
							onFocus={ this.recordFieldFocus( 'first_name' ) }
						/>
					</FormFieldset>
				);
				break;
			case 'last_name':
				returnField = (
					<FormFieldset key="last_name">
						<FormLabel htmlFor="last_name">
							{ this.props.translate( 'Last Name', {
								context: 'Text that is displayed in a label of a form.',
							} ) }
						</FormLabel>
						<FormTextInput
							id="last_name"
							name="last_name"
							value={ this.state.last_name }
							onChange={ this.handleChange }
							onFocus={ this.recordFieldFocus( 'last_name' ) }
						/>
					</FormFieldset>
				);
				break;
			case 'name':
				returnField = (
					<FormFieldset key="name">
						<FormLabel htmlFor="name">
							{ this.props.translate( 'Public Display Name', {
								context: 'Text that is displayed in a label of a form.',
							} ) }
						</FormLabel>
						<FormTextInput
							id="name"
							name="name"
							value={ this.state.name }
							onChange={ this.handleChange }
							onFocus={ this.recordFieldFocus( 'name' ) }
						/>
					</FormFieldset>
				);
				break;
		}

		return returnField;
	};

	render() {
		if ( ! this.props.user?.ID ) {
			return null;
		}

		const editableFields = this.getAllowedSettingsToChange();

		if ( ! editableFields.length ) {
			return null;
		}

		return (
			<form
				className="edit-team-member-form__form" // eslint-disable-line
				disabled={ this.props.disabled }
				onSubmit={ this.updateUser }
				onChange={ this.props.markChanged }
			>
				{ editableFields.map( this.renderField ) }
				<FormButtonsBar>
					<FormButton disabled={ ! this.hasUnsavedSettings() }>
						{ this.props.translate( 'Save changes', {
							context: 'Button label that prompts user to save form',
						} ) }
					</FormButton>
				</FormButtonsBar>
			</form>
		);
	}
}

const withUpdateUser = ( Component ) => {
	return ( props ) => {
		const { siteId, user, translate } = props;
		const dispatch = useDispatch();
		const { updateUser, isSuccess, isError, error } = useUpdateUserMutation( siteId, user?.login );

		React.useEffect( () => {
			isSuccess &&
				dispatch(
					successNotice(
						translate( 'Successfully updated @%(user)s', {
							args: { user: user?.login },
							context: 'Success message after a user has been modified.',
						} ),
						{ id: 'update-user-notice' }
					)
				);
		}, [ isSuccess, translate, dispatch, user ] );

		React.useEffect( () => {
			isError &&
				error &&
				dispatch(
					errorNotice(
						translate( 'There was an error updating @%(user)s', {
							args: { user: user?.login },
							context: 'Error message after A site has failed to perform actions on a user.',
						} ),
						{ id: 'update-user-notice' }
					)
				);
		}, [ isError, error, translate, dispatch, user ] );

		return <Component { ...props } updateUser={ updateUser } />;
	};
};

export default localize(
	connect(
		( state, { siteId, user } ) => {
			const externalContributors = ( siteId && requestExternalContributors( siteId ).data ) || [];
			return {
				currentUser: getCurrentUser( state ),
				isExternalContributor: externalContributors.includes( user?.linked_user_ID ?? user?.ID ),
				isVip: isVipSite( state, siteId ),
				isWPForTeamsSite: isSiteWPForTeams( state, siteId ),
			};
		},
		{
			recordGoogleEvent,
		}
	)( withUpdateUser( EditUserForm ) )
);
