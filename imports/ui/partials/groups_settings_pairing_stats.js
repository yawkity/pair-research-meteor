import './groups_settings_pairing_stats.html';

import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';

import { Pairings } from '../../api/pairings/pairings.js';
import { PairsHistory } from '../../api/pairs-history/pairs-history.js';
import { TasksHistory } from '../../api/tasks-history/tasks-history.js';
import { Schema } from '../../api/schema.js';

import { getStats } from '../../api/stats/methods.js'

Template.groups_settings_pairing_stats.onCreated(function() {
  this.state = new ReactiveDict();
  this.state.setDefault({
    selectedInfo: '',
    selectedTab: 'all'
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
  });

  console.log(getStats.call({ groupId: "sM3z5FkZfsABqcj3g" }));
});

Template.groups_settings_pairing_stats.onRendered(function() {
  $('ul.tabs').tabs();
});

Template.groups_settings_pairing_stats.helpers({
  sessionCount() {
    return Pairings.find().count();
  },
  pairingCount() {
    const instance = Template.instance();
    const selectedInfo = instance.state.get('selectedInfo');
    const selectedTab = instance.state.get('selectedTab');
    if (selectedTab) {
      const query = PairsHistory.constructQuery(selectedTab, selectedInfo);
      if (query) {
        return PairsHistory.find(query).count();
      }
    }
  },
  popularTasks() {
    // TODO: allow count tweaking
    const instance = Template.instance();
    const selectedInfo = instance.state.get('selectedInfo');
    const selectedTab = instance.state.get('selectedTab');
    if (selectedTab) {
      const query = TasksHistory.constructQuery(selectedTab, selectedInfo);
      if (query) {
        return TasksHistory.popularTasks(query, 30);
      }
    }
  },
  topPartners(output) {
    const instance = Template.instance();
    const selectedInfo = instance.state.get('selectedInfo');
    const selectedTab = instance.state.get('selectedTab');
    if (selectedInfo && selectedTab) {
      return PairsHistory.topPartners(selectedTab, selectedInfo, output);
    }
  }
});

Template.groups_settings_pairing_stats.events({
  'click .chip.clickable'(event, instance) {
    const $target = $(event.target);
    $('.chip.clickable').removeClass('active');
    $target.toggleClass('active');
    instance.state.set('selectedInfo', $target.data('id'));
  },
  'click ul.tabs a'(event, instance) {
    event.preventDefault();
    const $target = $(event.target);
    instance.state.set('selectedTab', $target.attr('href').slice(1));
  }
});
