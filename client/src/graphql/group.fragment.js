import gql from 'graphql-tag';

import MESSAGE_FRAGMENT from './message.fragment';

const GROUP_FRAGMENT = gql`
  fragment GroupFragment on Group {
    id
    name
    label
    users {
      id
      username
    }
    tags {
      id
      tag
      category {
        id
        category
      }
    }
    messages(messageConnection: $messageConnection) {
      edges {
        cursor
        node {
          ... MessageFragment
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
    }
    userType {
      id
      type
    }
  }
  ${MESSAGE_FRAGMENT}
`;

export default GROUP_FRAGMENT;
