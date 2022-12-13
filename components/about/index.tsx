import React from "react";
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import GitHubIcon from '@mui/icons-material/GitHub';
import { useTheme } from "@mui/material";
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import DoubleArrowRoundedIcon from '@mui/icons-material/DoubleArrowRounded';

const About = () => {
    const 
        {palette:{text}} = useTheme()

    return (
        <Stack direction='column' spacing={2} p={2} maxWidth={600} sx={{m:'auto'}}>
            <Typography variant='h5' fontWeight='bold'>About This Site</Typography>
            <Box>
                <Tooltip title='Check the code'>
                    <IconButton href='#' target='_blank'>
                        <GitHubIcon fontSize="large" htmlColor={text.primary} />
                    </IconButton>
                </Tooltip>
            </Box>
            <Typography>
                The inspiration comes from project management sites such as Jira and Asana. 
                Both are awesome, but I think the subtask function (with just one level of subtask) has room for improvement. 
                In the real world, it is rarely so simple. In this app, the user can have unlimited levels of subtasks and parents for each task.
            </Typography>
            <Typography variant='h6' fontWeight='bold'>Languages and Frameworks</Typography>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell sx={{px:0,py:1,fontWeight:'bold'}}>Frontend</TableCell>
                        <TableCell sx={{px:0,py:1,fontWeight:'bold'}}>Backend</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    <TableRow>
                        <TableCell sx={{verticalAlign:'top',p:0}}>
                            <List>
                                <ListItem>NextJS</ListItem>
                                <ListItem>Redux Toolkit</ListItem>
                                <ListItem>Material UI</ListItem>
                            </List>
                        </TableCell>
                        <TableCell sx={{verticalAlign:'top',p:0}}>
                            <List>
                                <ListItem>Go</ListItem>
                                <ListItem>PostgreSQL</ListItem>
                                <ListItem>Websocket</ListItem>
                            </List>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
            <Stack direction='row' spacing={2}>
                <Button
                    sx={{fontWeight:'bold'}}
                    variant='contained'
                    endIcon={<DoubleArrowRoundedIcon />}
                    href='#'
                    target='_blank'
                >To My Portfolio</Button>
            </Stack>
        </Stack>
    )
}

export default About