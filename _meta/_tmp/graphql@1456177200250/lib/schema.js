import {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLList,
  GraphQLString,
  GraphQLInt,
  GraphQLNonNull
} from 'graphql';

import {
  GraphQLLimitedString
} from 'graphql-custom-types';

import { getPosts, getAuthor, getAuthors, getComments, createPost, getEvents, createEvent } from './dynamo';

const Event = new GraphQLObjectType({
    name: "Event",
    description: "User reporting their mood at a specific time",
    fields: () => ({
        user: {
            type: GraphQLString,
            description: "Email address of the user"
        },
        mood: {
            type: GraphQLString,
            description: "The mood the user is in"
        },
        created: {
            type: GraphQLInt,
            description: "Creation Timestamp of the event"
        }
    })
});

const Author = new GraphQLObjectType({
  name: "Author",
  description: "Author of the blog post",
  fields: () => ({
      id: {type: GraphQLString},
      name: {type: GraphQLString}
    })
});

const Comment = new GraphQLObjectType({
  name: "Comment",
  description: "Comment on the blog post",
  fields: () => ({
      id: {type: GraphQLString},
      content: {type: GraphQLString},
      author: {
        type: Author,
        resolve: function({author}) {
          return getAuthor(author);
        }
      }
    })
});

const Post = new GraphQLObjectType({
  name: "Post",
  description: "Blog post content",
  fields: () => ({
    id: {type: GraphQLString},
    title: {type: GraphQLString},
    bodyContent: {type: GraphQLString},
    author: {
      type: Author,
      resolve: function({author}) {
        return getAuthor(author);
      }
    },
    comments: {
      type: new GraphQLList(Comment),
      resolve: function(post) {
        return getComments();
      }
    }
  })
});

const Query = new GraphQLObjectType({
  name: 'BlogSchema',
  description: "Root of the Blog Schema",
    fields: () => ({
        events: {
            type: new GraphQLList(Event),
            description: "List of Events",
            args: {
                user: {type: new GraphQLNonNull(GraphQLString)},
                start: {type: new GraphQLNonNull(GraphQLInt)},
                end: {type: new GraphQLNonNull(GraphQLInt)}
            },
            resolve: function(user,start,end) {
                return getEvents(user,start,end);
            }
        },
    posts: {
      type: new GraphQLList(Post),
      description: "List of posts in the blog",
      resolve: function(source, {category}) {
        return getPosts();
      }
    },
    authors: {
      type: new GraphQLList(Author),
      description: "List of Authors",
      resolve: function() {
        return getAuthors();
      }
    },
    author: {
      type: Author,
      description: "Get Author by id",
      args: {
        id: {type: new GraphQLNonNull(GraphQLString)}
      },
      resolve: function(source, {id}) {
        return getAuthor(author);
      }
    }
  })
});

const Mutuation = new GraphQLObjectType({
  name: 'BlogMutations',
    fields: {
        createEvent: {
            type: Event,
            description: "Add a new timestamped event",
            args: {
                user: {type: new GraphQLNonNull(GraphQLString)},
                mood: {type: new GraphQLNonNull(GraphQLString)}
            },
            resolve: function(source,args) {
                var created = new Date().getTime() / 1000;
                args.created = created;
                return createEvent(args);
            }
        },
    createPost: {
      type: Post,
      description: "Create blog post",
      args: {
        id: {type: new GraphQLNonNull(GraphQLString)},
        title: {type: new GraphQLLimitedString(10, 30)},
        bodyContent: {type: new GraphQLNonNull(GraphQLString)},
        author: {type: new GraphQLNonNull(GraphQLString), description: "Id of the author"}
      },
      resolve: function(source, args) {
        return createPost(args);
      }
    }
  }
});

const Schema = new GraphQLSchema({
  query: Query,
  mutation: Mutuation
});

export default Schema;
