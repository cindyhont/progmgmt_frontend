import React from "react";
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Button from '@mui/material/Button';
import DoubleArrowRoundedIcon from '@mui/icons-material/DoubleArrowRounded';
import { styled } from '@mui/material/styles';

const 
    TableHeadCell = styled(TableCell)(({theme:{spacing}})=>({padding:`${spacing(1)} 0`,fontWeight:'bold'})),
    TableBodyCell = styled(TableCell)(()=>({verticalAlign:'top',padding:'0px'})),
    About = () => (
        <Stack direction='column' spacing={2} p={2} maxWidth={600} sx={{m:'auto'}}>
            <Typography variant='h5' fontWeight='bold'>About This Site</Typography>
            <Typography>
                The inspiration comes from project management sites such as Jira and Asana. 
                Both are awesome, but I think the subtask function (with just one level of subtask) has room for improvement. 
                In the real world, it is rarely so simple. In this app, the user can have unlimited levels of subtasks and parents for each task.
            </Typography>
            <Typography variant='h6' fontWeight='bold'>Languages and Frameworks</Typography>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableHeadCell>Frontend</TableHeadCell>
                        <TableHeadCell>Backend</TableHeadCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    <TableRow>
                        <TableBodyCell>
                            <List>
                                <ListItem>NextJS</ListItem>
                                <ListItem>Redux Toolkit</ListItem>
                                <ListItem>Material UI</ListItem>
                            </List>
                        </TableBodyCell>
                        <TableBodyCell>
                            <List>
                                <ListItem>Go</ListItem>
                                <ListItem>PostgreSQL</ListItem>
                                <ListItem>Websocket</ListItem>
                            </List>
                        </TableBodyCell>
                    </TableRow>
                </TableBody>
            </Table>
            <Stack direction='row' spacing={2}>
                <Button
                    sx={{fontWeight:'bold'}}
                    variant='contained'
                    endIcon={<DoubleArrowRoundedIcon />}
                    href='https://cindyhodev.com'
                    target='_blank'
                >To My Portfolio</Button>
            </Stack>
        </Stack>
    )

export default About