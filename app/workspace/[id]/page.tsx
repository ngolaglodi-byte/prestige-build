import React from 'react';
import { AI_Panel } from './components/AI_Panel';
import { FileTree } from './components/FileTree';
import { Tabs } from './components/Tabs';
import { Editor } from './components/Editor';
import { DiffViewer } from './components/DiffViewer';
import { MultiFilePreview } from './components/MultiFilePreview';

const WorkspacePage = () => {
    return (
        <div className="workspace-layout">
            <AI_Panel />
            <FileTree />
            <Tabs />
            <Editor />
            <DiffViewer />
            <MultiFilePreview />
        </div>
    );
};

export default WorkspacePage;