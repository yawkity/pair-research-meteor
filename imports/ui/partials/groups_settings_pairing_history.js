import './groups_settings_pairing_history.html';

import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { _ } from 'lodash';

import { PairsHistory } from '../../api/pairs-history/pairs-history.js';
import { TasksHistory } from '../../api/tasks-history/tasks-history.js';
import { Schema } from '../../api/schema.js';

const PAIRS_PER_PAGE = 20;

Template.groups_settings_pairing_history.onCreated(function() {
  this.state = new ReactiveDict();
  this.state.setDefault({
    offset: 0,
    maxOffset: 0
  });

  this.autorun(() => {
    const data = Template.currentData();
    if (!_.isEmpty(data) && !_.isEmpty(data.group)) {
      Schema.Group.validate(data.group);
      const groupId = data.group._id;
      this.subscribe('pairings.all.byGroup', groupId);
      this.subscribe('pairsHistory.byGroup', groupId);
      this.subscribe('tasksHistory.byGroup', groupId);
    }
    this.state.set('maxOffset', Math.floor(PairsHistory.find().count() / PAIRS_PER_PAGE) - 1);
  });
});

Template.groups_settings_pairing_history.helpers({
  pairings() {
    const instance = Template.instance();
    return PairsHistory.find({}, {
      limit: PAIRS_PER_PAGE,
      skip: instance.state.get('offset') * PAIRS_PER_PAGE,
      sort: {
        timestamp: -1,
        pairingId: 1
      }
    });
  },
  offset() {
    const instance = Template.instance();
    return instance.state.get('offset');
  },
  maxOffset() {
    const instance = Template.instance();
    // TODO: this isn't scaleable
    // @see https://trello.com/c/f8LIZoTm/113-pairing-history-pagination-goes-crazy-when-there-s-a-high-number-of-pages
    return instance.state.get('maxOffset');
  },
  offsets() {
    return _.range(0, PairsHistory.find().count(), PAIRS_PER_PAGE);
  },
  task(userId, pairingId) {
    const task= TasksHistory.findOne({ userId, pairingId });
    return task && task.task;
  },
});

Template.groups_settings_pairing_history.events({
  'click a[href=#set-page]'(event, instance) {
    const pageNumber = $(event.target).data('index');
    instance.state.set('offset', pageNumber);
  },
  'click a[href=#page-left]'(event, instance) {
    const offset = instance.state.get('offset');
    if (offset > 0) {
      instance.state.decrement('offset');
    }
  },
  'click a[href=#page-right]'(event, instance) {
    const offset = instance.state.get('offset');
    const max = instance.state.get('maxOffset');
    if (offset < max) {
      instance.state.increment('offset');
    }
  },
});