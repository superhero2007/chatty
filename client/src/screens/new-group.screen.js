import { _ } from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  ActivityIndicator,
  Button,
  Image,
  StyleSheet,
  Text,
  View,
  ListView,
  ScrollView,
} from 'react-native';
import { RadioButton } from 'react-native-paper';
import { graphql, compose } from 'react-apollo';
import update from 'immutability-helper';
import Icon from 'react-native-vector-icons/FontAwesome';
import { connect } from 'react-redux';

import USER_QUERY from '../graphql/user.query';
import CATEGORY_QUERY from '../graphql/category.query';

// eslint-disable-next-line
const sortObject = o => Object.keys(o).sort().reduce((r, k) => (r[k] = o[k], r), {});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  cellContainer: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cellImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  cellLabel: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selected: {
    flexDirection: 'row',
  },
  loading: {
    justifyContent: 'center',
    flex: 1,
  },
  navIcon: {
    color: 'blue',
    fontSize: 18,
    paddingTop: 2,
  },
  checkButtonContainer: {
    paddingRight: 12,
    paddingVertical: 6,
  },
  checkButton: {
    borderWidth: 1,
    borderColor: '#dbdbdb',
    padding: 4,
    height: 24,
    width: 24,
  },
  checkButtonIcon: {
    marginRight: -4, // default is 12
  },
});

const SectionHeader = ({ title }) => {
  // inline styles used for brevity, use a stylesheet when possible
  const textStyle = {
    textAlign: 'center',
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  };

  const viewStyle = {
    backgroundColor: '#ccc',
  };
  return (
    <View style={viewStyle}>
      <Text style={textStyle}>{title}</Text>
    </View>
  );
};
SectionHeader.propTypes = {
  title: PropTypes.string,
};

const SectionItem = ({ title }) => (
  <Text style={{ color: 'blue' }}>{title}</Text>
);
SectionItem.propTypes = {
  title: PropTypes.string,
};

class Cell extends Component {
  constructor(props) {
    super(props);
  }

  componentWillReceiveProps(nextProps) {
  }

  render() {
    return (
      <View style={styles.cellContainer}>
        <Text>{JSON.stringify(this.props)}</Text>
      </View>
    );
  }
}
Cell.propTypes = {
  id: PropTypes.number,
  title: PropTypes.string,
  items: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number,
    tag: PropTypes.string,
  })),
  selected: PropTypes.number,
};

class NewGroup extends Component {
  static navigationOptions = ({ navigation }) => {
    const { state } = navigation;
    const isReady = state.params && state.params.mode === 'ready';
    return {
      title: 'New Group',
      headerRight: (
        isReady ? <Button
          title="Next"
          onPress={state.params.finalizeGroup}
        /> : undefined
      ),
    };
  };

  constructor(props) {
    super(props);
    let category = props.category;
    category = _.map(category, (categoryElement) => {
      return {
        id: categoryElement.id,
        category: categoryElement.category,
        tags: categoryElement.tags,
        selectedTag: categoryElement.tags[0].id,
      };
    });
    const list = category || [];

    this.state = {
      selected: props.user.friends,
      friends: props.user ?
        _.groupBy(props.user.friends, friend => friend.username.charAt(0).toUpperCase()) : [],
      list,
    };

    this.finalizeGroup = this.finalizeGroup.bind(this);
    this.toggle = this.toggle.bind(this);
  }

  componentDidMount() {
    this.refreshNavigation(this.state.selected);
  }

  componentWillReceiveProps(nextProps) {
    const state = {};
    if (nextProps.user && nextProps.user.friends && nextProps.user !== this.props.user) {
      state.friends = sortObject(
        _.groupBy(nextProps.user.friends, friend => friend.username.charAt(0).toUpperCase()),
      );
    }

    if (nextProps.category) {
      let category = nextProps.category;
      category = _.map(category, (categoryElement) => {
        return {
          id: categoryElement.id,
          category: categoryElement.category,
          tags: categoryElement.tags,
          selectedTag: categoryElement.tags[0].id,
        };
      });
      const list = category || [];
      this.state.list = list;
    }

    if (nextProps.selected) {
      Object.assign(state, {
        selected: nextProps.selected,
      });
    }

    this.setState(state);
  }

  componentWillUpdate(nextProps, nextState) {
    if (!!this.state.selected.length !== !!nextState.selected.length) {
      this.refreshNavigation(nextState.selected);
    }
  }

  refreshNavigation(selected) {
    const { navigation } = this.props;
    navigation.setParams({
      mode: selected && selected.length ? 'ready' : undefined,
      finalizeGroup: this.finalizeGroup,
    });
  }

  finalizeGroup() {
    const { navigate } = this.props.navigation;
    navigate('FinalizeGroup', {
      selected: this.state.selected,
      friendCount: this.props.user.friends.length,
      userId: this.props.user.id,
    });
  }

  toggle = (categoryId, tagId) => {
    const { list } = this.state;
    const category = _.find(list, element => element.id === categoryId);
    category.selectedTag = tagId;
    this.state.list = list;
  };

  render() {
    const { user, loading } = this.props;
    const { list } = this.state;
    const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1.id !== r2.id});
    const listValue = ds.cloneWithRows(list);

    // render loading placeholder while we fetch messages
    if (loading || !user) {
      return (
        <View style={[styles.loading, styles.container]}>
          <ActivityIndicator />
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <ScrollView>
          <View style={{}}>
            <Text style={{ borderRadius: 5, backgroundColor: '#EEEEEE', margin: 15, padding: 8, fontWeigt: 'bold' }}>Coltura</Text>
            <RadioButton value="vite">Vite</RadioButton>
            <RadioButton value="frutta">Frutta</RadioButton>
            <RadioButton value="ortaggi">Ortaggi</RadioButton>
            <RadioButton value="cereali">Cereali</RadioButton>
            <RadioButton value="olivo">Olivo</RadioButton>
            <RadioButton value="leguminose">Leguminose</RadioButton>
            <RadioButton value="industriali">Industriali</RadioButton>
            <RadioButton value="altro">Altro</RadioButton>

            <Text style={{ borderRadius: 5, backgroundColor: '#EEEEEE', margin: 15, padding: 8, fontWeigt: 'bold' }}>Tipo</Text>
            <RadioButton value="produzione">Produzione</RadioButton>
            <RadioButton value="trasformazione">Trasformazione</RadioButton>
            <RadioButton value="certificazione">Certificazione</RadioButton>
            <RadioButton value="altro">Altro</RadioButton>

            <Text style={{ borderRadius: 5, backgroundColor: '#EEEEEE', margin: 15, padding: 8, fontWeigt: 'bold' }}>Genere</Text>
            <Text style={{ borderRadius: 5, backgroundColor: '#EEEEEE', margin: 15, padding: 8, fontWeigt: 'bold' }}>Motivo</Text>
          </View>
        </ScrollView>
        <ListView
          dataSource={listValue}
          renderRow={rowData => <Cell
            id={rowData.id}
            selected={rowData.selectedTag}
            items={rowData.tags}
            title={rowData.category}
            toggle={this.toggle}
            />
          }
        />
      </View>
    );
  }
}

NewGroup.propTypes = {
  loading: PropTypes.bool.isRequired,
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    setParams: PropTypes.func,
    state: PropTypes.shape({
      params: PropTypes.object,
    }),
  }),
  user: PropTypes.shape({
    id: PropTypes.number,
    friends: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.number,
      username: PropTypes.string,
    })),
  }),
  category: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number,
    category: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.number,
      tag: PropTypes.string,
    })),
  })),
  selected: PropTypes.arrayOf(PropTypes.object),
};

const userQuery = graphql(USER_QUERY, {
  options: ownProps => ({ variables: { id: ownProps.auth.id } }),
  props: ({ data: { loading, user } }) => ({
    loading, user,
  }),
});

const categoryQuery = graphql(CATEGORY_QUERY, {
  props: ({ data: { category } }) => ({
    category,
  }),
});

const mapStateToProps = ({ auth }) => ({
  auth,
});

export default compose(
  connect(mapStateToProps),
  userQuery,
  categoryQuery,
)(NewGroup);
