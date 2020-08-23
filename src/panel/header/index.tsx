import * as React from "react";
import styled from "styled-components";

import Tabs from "../components/tabs";
import Tooltip from "../components/tooltip";
import { Button, Icon } from "../components/table";
import {
  ILog,
  IStore,
} from "../../interface/mock";

const Wrapper = styled.div`
  display: flex;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.white};
  height: 36px;
  padding: 0 4px;
  align-items: center;
`;

const StyledTabs = styled(Tabs)`
  background: transparent;
  height: 100%;
  margin: 0 6px;
`;

const Filters = styled.div`
  cursor: pointer;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
`;

const ButtonWrrap = styled(Button)`
  margin-left: 6px;
  margin-right: 6px;
`;

const Input = styled.input`
  height: 28px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  border-style: solid;
  width: 300px;
  outline: none;
  margin: 0 6px;
  padding: 0 8px;
`;

const RecordIcon = styled(Icon) <{ border: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;

  ${({ border, theme }) =>
    border &&
    `
    border-radius: 100%;
    border: 2px solid ${theme.colors.alert};
    margin-left: -2px;
  `}
`;

const BreakLine = styled.div`
  height: 20px;
  width: 1px;
  border-left: 1px solid ${({ theme }) => theme.colors.border};
  padding-left: 6px;
  margin-left: 6px;
`;

const ButtonDisable = styled(Button) <{ isDisable: boolean }>`
  margin-right: 6px;
  margin-left: 6px;
  ${({ isDisable }) =>
    isDisable && 'opacity: 0.5; cursor: not-allowed;'
  }
`;

const IconClear = styled(Icon) <IProps>`
  color: ${({ route, mocks, logs, theme: { colors} }) =>
    route.includes('mock') ?
    (mocks.length > 0 ? colors['gray'] : colors['disable']) :
    (logs.length > 0 ? colors['gray'] : colors['disable'])};
`;

interface IProps {
  route: string;
  recording: boolean;
  logs: ILog[];
  mocks: IStore['mocks'];
  changeRoute: (route: string) => void;
  onSearchChange: (search: string) => void;
  clear: () => void;
  disableMocking: () => void;
  onRecordingClick: () => void;
  addMock: () => void;
  onImport: () => void;
  onExport: () => void;
}

const getSelected = (route: string) => {
  if (route.indexOf("logs") === 0) {
    return 1;
  }
  if (route.indexOf("mock") === 0) {
    return 0;
  }
};

const Header = (props: IProps) => {
  const [search, setSearch] = React.useState("");
  const isExportMock = props.route.includes('mock') && props.mocks.length > 0;
  
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    props.onSearchChange(event.target.value);
  };

  return (
    <Wrapper>
      <Filters>
        <Tooltip
          tooltipStyle={{ width: 320 }}
          tooltip="Record: Mock Every API call, until Recording is on, Mocks will be created when Recoding stops. Recording might overwrite existing Mock."
        >
          <RecordIcon
            onClick={props.onRecordingClick}
            border={props.recording}
            color={props.recording ? "alert" : 'gray'}
          >
            fiber_manual_record
          </RecordIcon>
        </Tooltip>
      </Filters>
      <Filters>
        <div onClick={() => location.reload()}>
          <Tooltip
            tooltipStyle={{ width: 92 }}
            tooltip="Refresh Page"
          >
            <Icon color="gray">refresh</Icon>
          </Tooltip>
        </div>
      </Filters>
      <Filters>
        <div onClick={() => props.clear()}>
          <Tooltip
            tooltipStyle={{ width: 92 }}
            tooltip={`Clear ${props.route.includes('logs') ? 'Logs' : 'Mocks'}`}
          >
            <IconClear {...props} >block</IconClear>
          </Tooltip>
        </div>
      </Filters>
      <BreakLine />
      <Filters>
        <div onClick={() => props.onImport()}>
          <Tooltip
            tooltipStyle={{ width: 110 }}
            tooltip="Import JSON file"
          >
            <Icon color="gray">publish</Icon>
          </Tooltip>
        </div>
      </Filters>
      <Filters>
        <div onClick={() => isExportMock && props.onExport()}>
          <Tooltip
            tooltipStyle={{ width: 110 }}
            tooltip="Export all mocks to JSON file"
          >
            <Icon
              style={{ transform: 'rotate(180deg)' }}
              color={isExportMock? 'gray' : 'disable'}
            >publish</Icon>
          </Tooltip>
        </div>
      </Filters>
      <BreakLine />
      <StyledTabs
        selected={getSelected(props.route)}
        tabs={["Mocks", "Logs"]}
        onChange={(selected) => {
          if (selected === 1) {
            props.changeRoute("logs");
          } else {
            props.changeRoute("mock");
          }
        }}
      />
      <BreakLine />
      <Input
        title="Search logs/mocks"
        placeholder="Search logs/mocks"
        value={search}
        onChange={handleSearchChange}
      />
      <ButtonWrrap
        icon
        color="white"
        background="primary"
        onClick={() => props.addMock()}
      >
        <Icon>add</Icon> Create Mock
        </ButtonWrrap>
      <BreakLine />
      <ButtonDisable
        isDisable={false}
        transparent
        icon
        onClick={() => props.disableMocking()}
      >
        <Icon>lock</Icon> Disable
      </ButtonDisable>
    </Wrapper>
  );
};

export default Header;
