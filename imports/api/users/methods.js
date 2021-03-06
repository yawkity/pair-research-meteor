import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Email } from 'meteor/email';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { _ } from 'lodash';

import { Groups } from '../groups/groups.js';
import { Auth, AuthMixin } from '../authentication.js';
import { EMAIL_ADDRESS, CONTACT_EMAILS } from '../constants.js';

/**
 * @summary Finds users email from Account enrollment email token.
 * @isMethod true
 */
export const findEmailFromToken = new ValidatedMethod({
  name: 'users.find.email.token',
  validate: new SimpleSchema({
    token: {
      type: String
    }
  }).validator(),
  run({ token }) {
    if (!this.isSimulation) {
      const user = Meteor.users.findOne({ 'services.password.reset.token': token });
      if (user) {
        return user.services.password.reset.email;
      } else {
        throw new Meteor.Error('invalid-token', 'The token provided does not match any known users.', JSON.stringify(token));
      }
    }
  }
});

/**
 * @summary Sets user profile info.
 * @isMethod true
 */
export const setProfile = new ValidatedMethod({
  name: 'users.update.name',
  validate: new SimpleSchema({
    profile: {
      type: Object
    },
    'profile.fullName': {
      type: String,
      optional: true
    },
    'profile.avatar': {
      type: String,
      optional: true
    }
  }).validator(),
  mixins: [AuthMixin],
  allow: [Auth.LoggedIn],
  run({ profile }) {
    if (profile.avatar && profile.avatar !== '' && !SimpleSchema.RegEx.Url.test(profile.avatar)) {
      throw new Meteor.Error('Avatar link must be a valid url.');
    }

    const user =  Meteor.users.findOne(this.userId);
    const groupIds = _.map(user.groups, group => group.groupId);
    Groups.find({
      _id: {
        $in: groupIds
      }
    }).forEach((group) => {
      const index = group.getMembershipIndex(this.userId);
      group.members[index].fullName = profile.fullName;
      Groups.update(group._id, { $set: { members: group.members } });
    });
    return Meteor.users.update(this.userId, { $set: { profile } });
  }
});

/**
 * @summary Sends and email to Kevin and Haoqi.
 * @isMethod true
 */
export const sendFeedback = new ValidatedMethod({
  name: 'users.sendemail',
  validate: new SimpleSchema({
    contact: {
      type: String,
      regEx: SimpleSchema.RegEx.Email
    },
    content: {
      type: String
    }
  }).validator(),
  run({ contact, content }) {
    const user = Meteor.users.findOne(this.userId);
    if (!this.isSimulation) {
      Email.send({
        from: EMAIL_ADDRESS,
        to: CONTACT_EMAILS,
        subject: `Feedback from ${ contact }`,
        text: `
${ contact } says:

${ content }

User metadata: ${ JSON.stringify(user) }
`
      });
    }
  }
});
