// Post.js
import React from 'react';
import { Card, CardContent, Typography, CardActions, IconButton } from '@mui/material';
import { ThumbUp, Comment, Share } from '@mui/icons-material';
import './Post.css';

const Post = ({ post }) => {
    return (
        <Card className="post">
            <CardContent>
                <Typography variant="h5" style={{ color: 'white' }}>{post.title}</Typography>
                <Typography variant="body2" style={{ color: 'white' }}>{post.content}</Typography>
            </CardContent>
            <CardActions>
                <IconButton style={{ color: 'white' }}>
                    <ThumbUp /> {post.likes}
                </IconButton>
                <IconButton style={{ color: 'white' }}>
                    <Comment />
                </IconButton>
                <IconButton style={{ color: 'white' }}>
                    <Share />
                </IconButton>
            </CardActions>
        </Card>
    );
};

export default Post;

