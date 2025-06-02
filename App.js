import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Button, StyleSheet, Text, View, Alert } from "react-native";
import {
  DataBit,
  DriverType,
  FlowControl,
  Mode,
  Parity,
  ReturnedDataType,
  StopBit,
  initSerialport,
  useSerialport,
} from "@serserm/react-native-turbo-serialport";

initSerialport({
  autoConnect: false,
  mode: Mode.ASYNC,
  params: {
    driver: DriverType.AUTO,
    portInterface: -1, // all interfaces
    returnedDataType: ReturnedDataType.UTF8,
    baudRate: 9600,
    dataBit: DataBit.DATA_BITS_8,
    stopBit: StopBit.STOP_BITS_1,
    parity: Parity.PARITY_NONE,
    flowControl: FlowControl.FLOW_CONTROL_OFF,
  },
});

export default function App() {
  const [connectedDevice, setConnectedDevice] = useState(null);

  const serialport = useSerialport({
    onError: ({ errorCode, errorMessage }) => {
      console.log("Serial Error:", errorMessage);
      Alert.alert("Serial Error", errorMessage);
    },
    onReadData: ({ deviceId, portInterface, data }) => {
      console.log(`Received Device ${deviceId}, IF ${portInterface}:`, data);
    },
    onConnected: ({ deviceId, portInterface }) => {
      console.log(`Connected: Device ${deviceId}, IF ${portInterface}`);
    },
    onDisconnected: ({ deviceId }) => {
      console.log("Device disconnected:", deviceId);
    },
    onDeviceAttached: ({ deviceId }) => {
      console.log("Device attached:", deviceId);
    },
    onDeviceDetached: ({ deviceId }) => {
      console.log("Device detached:", deviceId);
    },
  });

  const { listDevices } = serialport;

  const onPressSearch = async () => {
    const devices = await listDevices();
    const supportedDevice = devices.find((d) => d.isSupported);

    if (!supportedDevice) {
      Alert.alert("No supported USB device found.");
      return;
    }

    try {
      supportedDevice.setParams({
        baudRate: 9600,
        dataBit: DataBit.DATA_BITS_8,
        stopBit: StopBit.STOP_BITS_1,
        parity: Parity.PARITY_NONE,
        flowControl: FlowControl.FLOW_CONTROL_OFF,
      });

      // Connect both interfaces explicitly if needed
      await supportedDevice.connect();

      setConnectedDevice(supportedDevice);
      Alert.alert(
        "Device connected",
        supportedDevice.productName || "Unnamed device"
      );
    } catch (err) {
      Alert.alert("Failed to connect", err.message);
    }
  };

  const sendCommand = (message) => {
    if (!connectedDevice) {
      Alert.alert("Not connected", "Please connect a device first.");
      return;
    }

    try {
      connectedDevice.writeString(message + "\n", 1); // Write to interface 1
      connectedDevice.writeString(message + "\n", 2); // Write to interface 2
    } catch (err) {
      Alert.alert("Failed to send", err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>USB Serial LED Controller</Text>
      <Button title="Search & Connect USB Device" onPress={onPressSearch} />
      <View style={{ height: 20 }} />
      <Button title="LED ON" onPress={() => sendCommand("LED ON")} />
      <View style={{ height: 10 }} />
      <Button title="LED OFF" onPress={() => sendCommand("LED OFF")} />
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 20,
    color: "white",
    marginBottom: 20,
  },
});
